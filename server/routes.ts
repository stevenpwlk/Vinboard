import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { importBottleSchema, type InsertBottle } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const authDisabled = process.env.AUTH_DISABLED !== "false";
  const mockUser = {
    id: "local-dev",
    email: "local@vinboard",
    name: "Local User",
  };

  if (authDisabled) {
    app.use((req, _res, next) => {
      (req as any).user = mockUser;
      (req as any).session = { userId: mockUser.id };
      next();
    });

    app.get("/api/auth/user", (_req, res) => {
      res.json(mockUser);
    });
  } else {
    await setupAuth(app);
    registerAuthRoutes(app);
  }

  // 2. Protect all API routes (except auth ones which are handled internally)
  // We can use a middleware for /api/* but we need to exclude /api/login, /api/callback, /api/logout
  // Ideally, apply isAuthenticated to specific routes or groups.
  const authGuard = authDisabled ? (_req: any, _res: any, next: any) => next() : isAuthenticated;

  // Helper to extract user ID safely
  const getUserId = (req: any) => {
    return req.user?.id;
  };

  // --- BOTTLES ---

  app.get(api.bottles.list.path, authGuard, async (req, res) => {
    const userId = getUserId(req);
    const bottles = await storage.getBottles(userId);
    res.json(bottles);
  });

  app.get(api.bottles.get.path, authGuard, async (req, res) => {
    const userId = getUserId(req);
    const bottle = await storage.getBottle(req.params.id, userId);
    if (!bottle) {
      return res.status(404).json({ message: "Bottle not found" });
    }
    res.json(bottle);
  });

  app.post(api.bottles.create.path, authGuard, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.bottles.create.input.parse(req.body);
      const bottle = await storage.createBottle({ ...input, userId });
      res.status(201).json(bottle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.bottles.update.path, authGuard, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.bottles.update.input.parse(req.body);
      const updated = await storage.updateBottle(req.params.id, userId, input);
      if (!updated) {
        return res.status(404).json({ message: "Bottle not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.bottles.delete.path, authGuard, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteBottle(req.params.id, userId);
    res.status(204).send();
  });

  // --- IMPORT ---

  app.post(api.bottles.import.path, authGuard, async (req, res) => {
    const userId = getUserId(req);
    let items = req.body;
    
    // Normalize to array
    if (!Array.isArray(items)) {
      items = [items];
    }

    const results = {
      importedCount: 0,
      updatedCount: 0,
      errors: [] as { externalKey: string; reason: string }[]
    };

    for (const item of items) {
      try {
        // Pre-processing / Alias mapping
        const processed = {
          ...item,
          price_updated_at: item.price_checked_date,
          price_sources_json: item.price_sources,
          sources_json: item.sources,
          grapes: Array.isArray(item.grapes) ? item.grapes.join(", ") : item.grapes,
        };

        const validated = importBottleSchema.parse(processed);

        // Check if exists
        const existing = await storage.getBottleByExternalKey(validated.external_key, userId);

        if (existing) {
          // Update / Merge
          const newQuantity = (existing.quantity || 0) + (validated.quantity || 1);
          
          // Merge logic: only update fields that are present in incoming and null in existing?
          // Prompt says: "For other fields: do NOT overwrite existing non-null values with null. If incoming has a non-null value, update it"
          // So incoming non-null wins.
          
          const updates: any = {};
          // Map schema keys to DB keys (camelCase vs snake_case is handled by drizzle/zod schema mapping usually, 
          // but here we parsed into camelCase-ish via ImportSchema? 
          // Wait, importBottleSchema uses snake_case keys. Drizzle schema uses camelCase keys with snake_case DB columns.
          // We need to map validated (snake_case) to InsertBottle (camelCase).
          
          const mapToInsert = (v: any): Partial<InsertBottle> => ({
             externalKey: v.external_key,
             producer: v.producer,
             wine: v.wine,
             vintage: v.vintage,
             country: v.country,
             region: v.region,
             appellation: v.appellation,
             color: v.color,
             type: v.type,
             sizeMl: v.size_ml,
             grapes: v.grapes,
             abv: v.abv,
             barcode: v.barcode,
             windowStartYear: v.window_start_year,
             peakStartYear: v.peak_start_year,
             peakEndYear: v.peak_end_year,
             windowEndYear: v.window_end_year,
             windowSource: v.window_source,
             confidence: v.confidence,
             servingTempC: v.serving_temp_c,
             decanting: v.decanting,
             priceMinEur: v.price_min_eur,
             priceTypicalEur: v.price_typical_eur,
             priceMaxEur: v.price_max_eur,
             priceUpdatedAt: v.price_updated_at ? new Date(v.price_updated_at) : undefined,
             priceSourcesJson: v.price_sources,
             sourcesJson: v.sources,
             notes: v.notes,
             quantity: newQuantity, // Explicitly calculated
             location: v.location,
             bin: v.bin
          });

          const mapped = mapToInsert(validated);
          
          // Construct updates: Incoming non-null overrides.
          // Since mapped has everything from validated, just filtering out undefined/null from mapped
          // will give us the "incoming non-nulls".
          // BUT prompt says: "If incoming has a non-null value, update it (but never clobber better data with null)."
          
          Object.keys(mapped).forEach(key => {
             const val = (mapped as any)[key];
             if (val !== undefined && val !== null) {
               updates[key] = val;
             }
          });
          
          await storage.updateBottle(existing.id, userId, updates);
          results.updatedCount++;

        } else {
          // Create
          const mapToInsert = (v: any): InsertBottle => ({
             userId,
             externalKey: v.external_key,
             producer: v.producer,
             wine: v.wine,
             vintage: v.vintage,
             country: v.country,
             region: v.region,
             appellation: v.appellation,
             color: v.color,
             type: v.type,
             sizeMl: v.size_ml,
             grapes: v.grapes,
             abv: v.abv,
             barcode: v.barcode,
             windowStartYear: v.window_start_year,
             peakStartYear: v.peak_start_year,
             peakEndYear: v.peak_end_year,
             windowEndYear: v.window_end_year,
             windowSource: v.window_source,
             confidence: v.confidence,
             servingTempC: v.serving_temp_c,
             decanting: v.decanting,
             priceMinEur: v.price_min_eur,
             priceTypicalEur: v.price_typical_eur,
             priceMaxEur: v.price_max_eur,
             priceUpdatedAt: v.price_updated_at ? new Date(v.price_updated_at) : undefined,
             priceSourcesJson: v.price_sources,
             sourcesJson: v.sources,
             notes: v.notes,
             quantity: v.quantity || 1,
             location: v.location,
             bin: v.bin
          });
          
          await storage.createBottle(mapToInsert(validated));
          results.importedCount++;
        }

      } catch (err) {
        const key = (item as any).external_key || "unknown";
        results.errors.push({ 
          externalKey: key, 
          reason: err instanceof Error ? err.message : "Invalid data" 
        });
      }
    }

    res.json(results);
  });

  // --- OPENED ---

  app.get(api.opened.list.path, authGuard, async (req, res) => {
    const userId = getUserId(req);
    const opened = await storage.getOpenedBottles(userId);
    res.json(opened);
  });

  app.post(api.opened.create.path, authGuard, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.opened.create.input.parse(req.body);
      const opened = await storage.createOpenedBottle({ ...input, userId });
      res.status(201).json(opened);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- DASHBOARD ---

  app.get(api.dashboard.stats.path, authGuard, async (req, res) => {
    const userId = getUserId(req);
    const stats = await storage.getDashboardStats(userId);
    res.json(stats);
  });

  // --- SEED (DEMO) ---
  app.post("/api/seed", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const existing = await storage.getBottles(userId);
    if (existing.length > 0) {
      return res.json({ message: "Cellar already has bottles, skipping seed" });
    }

    const samples = [
      {
        externalKey: "demo-1",
        producer: "Domaine de la Romanée-Conti",
        wine: "Romanée-Conti",
        vintage: "2015",
        country: "France",
        region: "Burgundy",
        appellation: "Vosne-Romanée",
        color: "red",
        type: "still",
        sizeMl: 750,
        quantity: 1,
        windowStartYear: 2025,
        peakStartYear: 2030,
        peakEndYear: 2040,
        windowEndYear: 2050,
        confidence: "high",
        notes: "The holy grail."
      },
      {
        externalKey: "demo-2",
        producer: "Château Margaux",
        wine: "Grand Vin",
        vintage: "2010",
        country: "France",
        region: "Bordeaux",
        appellation: "Margaux",
        color: "red",
        type: "still",
        sizeMl: 750,
        quantity: 3,
        windowStartYear: 2020,
        peakStartYear: 2025,
        peakEndYear: 2045,
        windowEndYear: 2060,
        confidence: "high",
        notes: "Perfect provenance."
      },
      {
        externalKey: "demo-3",
        producer: "Cloudy Bay",
        wine: "Sauvignon Blanc",
        vintage: "2023",
        country: "New Zealand",
        region: "Marlborough",
        color: "white",
        type: "still",
        sizeMl: 750,
        quantity: 6,
        windowStartYear: 2023,
        peakStartYear: 2023,
        peakEndYear: 2024,
        windowEndYear: 2025,
        confidence: "medium",
        notes: "Drink fresh."
      },
      {
         externalKey: "demo-4",
         producer: "Dom Pérignon",
         wine: "Vintage",
         vintage: "2012",
         country: "France",
         region: "Champagne",
         color: "sparkling",
         type: "sparkling",
         sizeMl: 750,
         quantity: 2,
         windowStartYear: 2020,
         peakStartYear: 2022,
         peakEndYear: 2035,
         windowEndYear: 2040,
         confidence: "high"
      }
    ];

    for (const s of samples) {
      await storage.createBottle({ ...s, userId } as InsertBottle);
    }
    
    res.json({ message: "Seeded demo data" });
  });

  return httpServer;
}
