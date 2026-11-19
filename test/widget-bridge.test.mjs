// Unit tests for the widget host bridge (widgets/bridge.ts), run against a
// stubbed iframe environment: a fake parent frame records what the widget
// posts and replays host messages to it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await build({
  entryPoints: [join(root, "widgets", "bridge.ts")],
  bundle: true,
  format: "esm",
  write: false,
});
const bundlePath = join(mkdtempSync(join(tmpdir(), "widget-bridge-")), "bridge.mjs");
writeFileSync(bundlePath, bundle.outputFiles[0].text);

let instance = 0;

/** Load a fresh copy of the bridge into a stubbed iframe environment. */
async function loadBridge({ openai } = {}) {
  const posted = [];
  const opened = [];
  const listeners = {};
  const parent = { postMessage: (msg) => posted.push(msg) };
  globalThis.window = {
    parent,
    openai,
    open: (url) => opened.push(url),
    addEventListener: (type, fn) => ((listeners[type] ??= []).push(fn)),
  };
  globalThis.document = { documentElement: { dataset: {}, scrollHeight: 100 }, body: {} };
  const bridge = await import(`${pathToFileURL(bundlePath).href}?instance=${instance++}`);
  /** Deliver a message from the host (the parent frame) to the widget. */
  const fromHost = (data) => listeners.message?.forEach((fn) => fn({ source: parent, data }));
  return { bridge, posted, opened, fromHost };
}

/** Boot the widget and complete the MCP Apps handshake with the given capabilities. */
async function bootWithHost(hostCapabilities) {
  const env = await loadBridge();
  env.bridge.boot(() => {});
  const init = env.posted.find((msg) => msg.method === "ui/initialize");
  assert.ok(init, "widget sends ui/initialize");
  env.fromHost({ jsonrpc: "2.0", id: init.id, result: { protocolVersion: "2026-01-26", hostCapabilities } });
  return env;
}

test("openLink sends ui/open-link when the host advertises openLinks", async () => {
  const { bridge, posted, opened } = await bootWithHost({ openLinks: {} });
  bridge.openLink("https://www.amazon.com/dp/B0TEST");
  const request = posted.find((msg) => msg.method === "ui/open-link");
  assert.deepEqual(request?.params, { url: "https://www.amazon.com/dp/B0TEST" });
  assert.equal(request.jsonrpc, "2.0");
  assert.notEqual(request.id, undefined, "ui/open-link is a request, so it carries an id");
  assert.notEqual(request.id, posted.find((msg) => msg.method === "ui/initialize").id);
  assert.deepEqual(opened, [], "window.open is not used when the host opens links");
});

test("openLink does not fall back to window.open when the host refuses", async () => {
  const { bridge, posted, opened, fromHost } = await bootWithHost({ openLinks: {} });
  bridge.openLink("https://www.amazon.com/dp/B0TEST");
  const request = posted.find((msg) => msg.method === "ui/open-link");
  fromHost({ jsonrpc: "2.0", id: request.id, error: { code: -32000, message: "Link opening denied by user" } });
  assert.deepEqual(opened, []);
});

test("openLink falls back to window.open when the host does not advertise openLinks", async () => {
  const { bridge, posted, opened } = await bootWithHost({});
  bridge.openLink("https://www.amazon.com/dp/B0TEST");
  assert.equal(posted.some((msg) => msg.method === "ui/open-link"), false);
  assert.deepEqual(opened, ["https://www.amazon.com/dp/B0TEST"]);
});

test("openLink falls back to window.open before the handshake completes", async () => {
  const { bridge, posted, opened } = await loadBridge();
  bridge.boot(() => {});
  bridge.openLink("https://www.amazon.com/dp/B0TEST");
  assert.equal(posted.some((msg) => msg.method === "ui/open-link"), false);
  assert.deepEqual(opened, ["https://www.amazon.com/dp/B0TEST"]);
});

test("openLink uses ChatGPT's openExternal when window.openai provides it", async () => {
  const external = [];
  const { bridge, posted, opened } = await loadBridge({
    openai: { openExternal: (opts) => external.push(opts) },
  });
  bridge.boot(() => {});
  bridge.openLink("https://www.amazon.com/dp/B0TEST");
  assert.deepEqual(external, [{ href: "https://www.amazon.com/dp/B0TEST" }]);
  assert.deepEqual(posted, []);
  assert.deepEqual(opened, []);
});
