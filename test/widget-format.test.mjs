// Unit tests for the widget render helpers (widgets/format.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await build({
  entryPoints: [join(root, "widgets", "format.ts")],
  bundle: true,
  format: "esm",
  write: false,
});
const bundlePath = join(mkdtempSync(join(tmpdir(), "widget-format-")), "format.mjs");
writeFileSync(bundlePath, bundle.outputFiles[0].text);
const { num, compactNum, setLocale } = await import(pathToFileURL(bundlePath).href);

test("numbers follow the host locale once it is set", () => {
  setLocale("en-US");
  assert.equal(num(49280), "49,280");
  assert.equal(compactNum(9280), "9,280");
  setLocale("de-DE");
  assert.equal(num(49280), "49.280");
  assert.equal(compactNum(9280), "9.280");
  setLocale("en_US"); // underscore form, as some hosts send
  assert.equal(num(49280), "49,280");
});

test("malformed or non-string locales are ignored", () => {
  setLocale("de-DE");
  setLocale("not a locale!");
  setLocale(undefined);
  setLocale(42);
  assert.equal(num(49280), "49.280");
});
