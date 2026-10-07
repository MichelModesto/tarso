import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "public");

test("the voting page references existing local assets", async () => {
  const html = await readFile(resolve(publicRoot, "index.html"), "utf8");
  const assets = [...html.matchAll(/(?:src|href)="([^"#?:]+)"/g)].map((match) => match[1]);
  assert.ok(assets.length >= 3);
  await Promise.all(assets.map((asset) => access(resolve(publicRoot, asset))));
});

test("all twenty optimized shirt images exist", async () => {
  const app = await readFile(resolve(publicRoot, "app.js"), "utf8");
  const images = [...app.matchAll(/"([0-9]{2}-[^"]+\.jpg)"/g)].map((match) => match[1]);
  assert.equal(images.length, 20);
  await Promise.all(images.map((image) => access(resolve(publicRoot, "images", image))));
});
