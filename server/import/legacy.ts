type LegacySource = string | { type?: string; url?: string };

function parseLegacyJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeSources(value: unknown): string[] {
  const parsed = parseLegacyJson(value);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .map((entry: LegacySource) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object") {
        return entry.url || JSON.stringify(entry);
      }
      return null;
    })
    .filter((entry): entry is string => Boolean(entry));
}

export function normalizeLegacyImport(item: Record<string, any>) {
  const legacy = item;
  const sourcesRaw = item.sources ?? item.sources_json;
  const priceSourcesRaw = item.price_sources ?? item.price_sources_json;
  const normalizedSources = normalizeSources(sourcesRaw);
  const normalizedPriceSources = normalizeSources(priceSourcesRaw);
  const priceUpdatedAt = item.price_updated_at ?? item.price_checked_at ?? item.price_checked_date;

  return {
    legacy,
    normalizedSources,
    normalizedPriceSources,
    priceUpdatedAt,
  };
}
