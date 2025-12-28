import assert from "node:assert/strict";
import { normalizeLegacyImport } from "../server/import/legacy";
import { importBottleSchema } from "../shared/schema";

const sample = {
  external_key: "legacy-1",
  sources_json: JSON.stringify(["foo", "bar"]),
  price_sources_json: JSON.stringify([{ type: "shop", url: "https://example.com" }]),
  price_checked_at: "2024-01-01",
  abv: "14.5%",
  size_ml: "750",
  notes: null,
};

const { normalizedItem } = normalizeLegacyImport(sample);
const processed = {
  ...normalizedItem,
  legacy_json: sample,
};

const parsed = importBottleSchema.safeParse(processed);
assert.equal(parsed.success, true);
assert.deepEqual(parsed.success && parsed.data.sources, ["foo", "bar"]);
assert.deepEqual(parsed.success && parsed.data.price_sources, ["https://example.com"]);
assert.equal(parsed.success && parsed.data.price_updated_at, "2024-01-01");
assert.equal(parsed.success && parsed.data.abv, 14.5);
assert.equal(parsed.success && parsed.data.size_ml, 750);

console.log("Legacy import normalization ok.");
