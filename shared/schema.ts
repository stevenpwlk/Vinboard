import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, doublePrecision, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import auth schema

// Re-export auth schemas
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const bottles = pgTable("bottles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(), // Links to users.id from auth
  externalKey: text("external_key").notNull(),
  producer: text("producer"),
  wine: text("wine"),
  vintage: text("vintage"),
  country: text("country"),
  region: text("region"),
  appellation: text("appellation"),
  color: text("color"), // red/white/rose/sparkling/unknown
  type: text("type"), // still/sparkling/fortified/sweet/unknown
  sizeMl: integer("size_ml"),
  grapes: text("grapes"),
  abv: doublePrecision("abv"),
  barcode: text("barcode"),
  windowStartYear: integer("window_start_year"),
  peakStartYear: integer("peak_start_year"),
  peakEndYear: integer("peak_end_year"),
  windowEndYear: integer("window_end_year"),
  windowSource: text("window_source").default("unknown"),
  confidence: text("confidence"), // high/medium/low
  servingTempC: doublePrecision("serving_temp_c"),
  decanting: text("decanting"),
  priceMinEur: doublePrecision("price_min_eur"),
  priceTypicalEur: doublePrecision("price_typical_eur"),
  priceMaxEur: doublePrecision("price_max_eur"),
  priceUpdatedAt: timestamp("price_updated_at"),
  priceSourcesJson: json("price_sources_json"), // array of strings
  sourcesJson: json("sources_json"), // array of strings
  legacyJson: jsonb("legacy_json").$type<Record<string, any>>(),
  notes: text("notes"),
  quantity: integer("quantity").default(1),
  location: text("location"),
  bin: text("bin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const openedBottles = pgTable("opened_bottles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  bottleId: text("bottle_id"), // Nullable if bottle deleted
  externalKey: text("external_key").notNull(),
  producer: text("producer"),
  wine: text("wine"),
  vintage: text("vintage"),
  openedAt: timestamp("opened_at").defaultNow(),
  quantityOpened: integer("quantity_opened").default(1),
  tastingNotes: text("tasting_notes"),
  rating100: integer("rating_100"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const bottlesRelations = relations(bottles, ({ one }) => ({
  user: one(users, {
    fields: [bottles.userId],
    references: [users.id],
  }),
}));

export const openedBottlesRelations = relations(openedBottles, ({ one }) => ({
  user: one(users, {
    fields: [openedBottles.userId],
    references: [users.id],
  }),
  bottle: one(bottles, {
    fields: [openedBottles.bottleId],
    references: [bottles.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertBottleSchema = createInsertSchema(bottles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOpenedBottleSchema = createInsertSchema(openedBottles).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Bottle = typeof bottles.$inferSelect;
export type InsertBottle = z.infer<typeof insertBottleSchema>;
export type OpenedBottle = typeof openedBottles.$inferSelect;
export type InsertOpenedBottle = z.infer<typeof insertOpenedBottleSchema>;

export type CreateBottleRequest = InsertBottle;
export type UpdateBottleRequest = Partial<InsertBottle>;

export type CreateOpenedBottleRequest = InsertOpenedBottle;
export type UpdateOpenedBottleRequest = Partial<InsertOpenedBottle>;

export type BottleStatus =
  | "to_verify"
  | "wait"
  | "peak"
  | "ready_before_peak"
  | "ready_after_peak"
  | "ready"
  | "drink_soon"
  | "possibly_past";

// Import Schema
const nullishString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const str = String(value).trim();
  if (!str || str.toLowerCase() === "nan") {
    return undefined;
  }
  return str;
}, z.string().optional());

const parseNumber = (value: string) => {
  const normalized = value.replace("%", "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const nullishNumber = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = parseNumber(value);
    return parsed;
  }
  return undefined;
}, z.number().optional());

const nullishInt = z.preprocess((value) => {
  const parsed = nullishNumber.parse(value);
  if (parsed === undefined) {
    return undefined;
  }
  return Math.trunc(parsed);
}, z.number().int().optional());

const nullishStringArray = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry)).filter(Boolean);
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}, z.array(z.string()).optional());

export const importBottleSchema = z.object({
  external_key: z.string(),
  producer: nullishString,
  wine: nullishString,
  vintage: nullishString,
  country: nullishString,
  region: nullishString,
  appellation: nullishString,
  color: nullishString,
  type: nullishString,
  size_ml: nullishInt,
  grapes: z.union([nullishString, nullishStringArray]).optional(),
  abv: nullishNumber,
  barcode: nullishString,
  window_start_year: nullishInt,
  peak_start_year: nullishInt,
  peak_end_year: nullishInt,
  window_end_year: nullishInt,
  window_source: nullishString,
  confidence: nullishString,
  serving_temp_c: nullishNumber,
  decanting: nullishString,
  price_min_eur: nullishNumber,
  price_typical_eur: nullishNumber,
  price_max_eur: nullishNumber,
  price_checked_date: nullishString, // Alias for price_updated_at
  price_updated_at: nullishString,
  price_checked_at: nullishString,
  price_sources: nullishStringArray, // Alias for price_sources_json
  sources: nullishStringArray, // Alias for sources_json
  notes: nullishString,
  quantity: nullishInt.default(1),
  location: nullishString,
  bin: nullishString,
});

export type ImportBottleInput = z.infer<typeof importBottleSchema>;

export interface ImportResponse {
  mode: "merge" | "sync";
  created: number;
  updated: number;
  skipped: number;
  errorsCount: number;
  importedCount: number;
  updatedCount: number;
  errors: { externalKey: string; reason: string }[];
}

export interface DashboardStats {
  openNow: number;
  peak: number;
  drinkSoon: number;
  wait: number;
  possiblyPast: number;
  toVerify: number;
}
