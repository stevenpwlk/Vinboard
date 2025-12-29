import assert from "node:assert/strict";
import { getMergeQuantity, getSyncQuantityUpdate } from "../server/import/mode";

const existingQuantity = 2;
const incomingQuantity = 2;

const mergedQuantity = getMergeQuantity(existingQuantity, incomingQuantity);
assert.equal(mergedQuantity, 4);

const syncedQuantity = getSyncQuantityUpdate(true, incomingQuantity);
assert.equal(syncedQuantity, 2);

console.log("Import mode quantity behavior ok.");
