import assert from "node:assert/strict";
import test from "node:test";
import { validatePlugin } from "../scripts/validate-plugin.mjs";

test("Agent Plugins 1.0.0 manifests and skills", async () => {
  const errors = await validatePlugin();
  assert.deepEqual(errors, []);
});
