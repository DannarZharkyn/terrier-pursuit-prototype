import assert from "node:assert/strict";
import test from "node:test";
import { createStoreZip } from "./store-zip";

test("createStoreZip builds a ZIP archive with local and central records", () => {
  const archive = createStoreZip([
    { name: "clue-01-photo.txt", data: new TextEncoder().encode("photo") },
  ]);
  const view = new DataView(archive.buffer);
  const text = new TextDecoder().decode(archive);

  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.ok(text.includes("clue-01-photo.txt"));
  assert.equal(view.getUint32(archive.length - 22, true), 0x06054b50);
});

