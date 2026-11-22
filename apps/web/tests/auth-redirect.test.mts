import assert from "node:assert/strict";
import { test } from "node:test";
import { safeAuthNext } from "../src/lib/auth-redirect.ts";

test("keeps local room and invite destinations", () => {
  assert.equal(safeAuthNext("/rooms"), "/rooms");
  assert.equal(safeAuthNext("/join/0123456789?from=email"), "/join/0123456789?from=email");
});

test("defaults to rooms for missing or external destinations", () => {
  for (const value of [null, undefined, "", "https://example.invalid", "//example.invalid"]) {
    assert.equal(safeAuthNext(value), "/rooms");
  }
});
