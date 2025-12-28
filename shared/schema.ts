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

export type BottleStatus = "open_now" | "drink_soon" | "wait" | "possibly_past" | "to_verify";

// Import Schema
export const importBottleSchema = z.object({
  external_key: z.string(),
  producer: z.string().optional(),
  wine: z.string().optional(),
  vintage: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  appellation: z.string().optional(),
  color: z.string().optional(),
  type: z.string().optional(),
  size_ml: z.number().optional(),
  grapes: z.union([z.string(), z.array(z.string())]).optional(),
  abv: z.number().optional(),
  barcode: z.string().optional(),
  window_start_year: z.number().optional(),
  peak_start_year: z.number().optional(),
  peak_end_year: z.number().optional(),
  window_end_year: z.number().optional(),
  window_source: z.string().optional(),
  confidence: z.string().optional(),
  serving_temp_c: z.number().optional(),
  decanting: z.string().optional(),
  price_min_eur: z.number().optional(),
  price_typical_eur: z.number().optional(),
  price_max_eur: z.number().optional(),
  price_checked_date: z.string().optional(), // Alias for price_updated_at
  price_updated_at: z.string().optional(),
  price_checked_at: z.string().optional(),
  price_sources: z.array(z.string()).optional(), // Alias for price_sources_json
  sources: z.array(z.string()).optional(), // Alias for sources_json
  notes: z.string().optional(),
  quantity: z.number().optional().default(1),
  location: z.string().optional(),
  bin: z.string().optional(),
});

export type ImportBottleInput = z.infer<typeof importBottleSchema>;

export interface ImportResponse {
  importedCount: number;
  updatedCount: number;
  errors: { externalKey: string; reason: string }[];
}

export interface DashboardStats {
  openNow: number;
  drinkSoon: number;
  wait: number;
  possiblyPast: number;
  toVerify: number;
}
