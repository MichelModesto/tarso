import test from "node:test";
import assert from "node:assert/strict";
import { getClientIp, hashIp, isValidOption } from "../functions/_shared.js";

test("accepts only shirt ids from 1 to 20", () => {
  assert.equal(isValidOption(1), true);
  assert.equal(isValidOption(20), true);
  assert.equal(isValidOption(0), false);
  assert.equal(isValidOption(21), false);
  assert.equal(isValidOption(3.5), false);
});

test("prefers Cloudflare's direct client IP header", () => {
  const request = new Request("https://example.com", {
    headers: { "CF-Connecting-IP": "203.0.113.8", "x-forwarded-for": "198.51.100.4" },
  });
  assert.equal(getClientIp(request), "203.0.113.8");
});

test("IP hashing is stable and salted", async () => {
  const first = await hashIp("203.0.113.8", "secret-a");
  const again = await hashIp("203.0.113.8", "secret-a");
  const different = await hashIp("203.0.113.8", "secret-b");
  assert.equal(first, again);
  assert.notEqual(first, different);
  assert.equal(first.length, 64);
});
