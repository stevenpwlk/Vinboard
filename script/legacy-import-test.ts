import assert from "node:assert/strict";
import { normalizeLegacyImport } from "../server/import/legacy";

const sample = {
  external_key: "legacy-1",
  sources_json: JSON.stringify(["foo", "bar"]),
  price_sources_json: JSON.stringify([{ type: "shop", url: "https://example.com" }]),
  price_checked_at: "2024-01-01",
};

const { normalizedSources, normalizedPriceSources, priceUpdatedAt, legacy } =
  normalizeLegacyImport(sample);

assert.deepEqual(normalizedSources, ["foo", "bar"]);
assert.deepEqual(normalizedPriceSources, ["https://example.com"]);
assert.equal(priceUpdatedAt, "2024-01-01");
assert.equal(legacy.external_key, "legacy-1");

console.log("Legacy import normalization ok.");
