import { db } from "./db";
import {
  bottles,
  openedBottles,
  type Bottle,
  type InsertBottle,
  type OpenedBottle,
  type InsertOpenedBottle,
  type UpdateBottleRequest,
  type UpdateOpenedBottleRequest,
  type DashboardStats
} from "@shared/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { computeBottleStatus } from "@shared/status";

export interface IStorage {
  // Bottles
  getBottles(userId: string, filters?: any): Promise<Bottle[]>;
  getBottle(id: string, userId: string): Promise<Bottle | undefined>;
  getBottleByExternalKey(externalKey: string, userId: string): Promise<Bottle | undefined>;
  createBottle(bottle: InsertBottle): Promise<Bottle>;
  updateBottle(id: string, userId: string, updates: UpdateBottleRequest): Promise<Bottle | undefined>;
  deleteBottle(id: string, userId: string): Promise<void>;
  
  // Opened History
  getOpenedBottles(userId: string): Promise<OpenedBottle[]>;
  createOpenedBottle(opened: InsertOpenedBottle): Promise<OpenedBottle>;
  updateOpenedBottle(id: string, userId: string, updates: UpdateOpenedBottleRequest): Promise<OpenedBottle | undefined>;
  
  // Stats
  getDashboardStats(userId: string): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // --- Bottles ---

  async getBottles(userId: string, filters?: any): Promise<Bottle[]> {
    const conditions = [eq(bottles.userId, userId)];

    if (filters?.q) {
      const term = `%${filters.q}%`;
      conditions.push(
        or(
          ilike(bottles.producer, term),
          ilike(bottles.wine, term),
          ilike(bottles.appellation, term),
          ilike(bottles.region, term),
          ilike(bottles.country, term),
          ilike(bottles.vintage, term),
          ilike(bottles.barcode, term),
          ilike(bottles.externalKey, term)
        )
      );
    }

    if (filters?.color) {
      conditions.push(eq(bottles.color, filters.color));
    }

    if (filters?.confidence) {
      conditions.push(eq(bottles.confidence, filters.confidence));
    }

    if (filters?.window_source) {
      conditions.push(eq(bottles.windowSource, filters.window_source));
    }

    if (filters?.location) {
      conditions.push(eq(bottles.location, filters.location));
    }

    return await db
      .select()
      .from(bottles)
      .where(and(...conditions))
      .orderBy(desc(bottles.createdAt));
  }

  async getBottle(id: string, userId: string): Promise<Bottle | undefined> {
    const [bottle] = await db
      .select()
      .from(bottles)
      .where(and(eq(bottles.id, id), eq(bottles.userId, userId)));
    return bottle;
  }

  async getBottleByExternalKey(externalKey: string, userId: string): Promise<Bottle | undefined> {
    const [bottle] = await db
      .select()
      .from(bottles)
      .where(and(eq(bottles.externalKey, externalKey), eq(bottles.userId, userId)));
    return bottle;
  }

  async createBottle(bottle: InsertBottle): Promise<Bottle> {
    const [newBottle] = await db.insert(bottles).values(bottle).returning();
    return newBottle;
  }

  async updateBottle(id: string, userId: string, updates: UpdateBottleRequest): Promise<Bottle | undefined> {
    const [updated] = await db
      .update(bottles)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(bottles.id, id), eq(bottles.userId, userId)))
      .returning();
    return updated;
  }

  async deleteBottle(id: string, userId: string): Promise<void> {
    await db
      .delete(openedBottles)
      .where(and(eq(openedBottles.bottleId, id), eq(openedBottles.userId, userId)));
    await db
      .delete(bottles)
      .where(and(eq(bottles.id, id), eq(bottles.userId, userId)));
  }

  // --- Opened History ---

  async getOpenedBottles(userId: string): Promise<OpenedBottle[]> {
    return await db
      .select()
      .from(openedBottles)
      .where(eq(openedBottles.userId, userId))
      .orderBy(desc(openedBottles.openedAt));
  }

  async createOpenedBottle(opened: InsertOpenedBottle): Promise<OpenedBottle> {
    const [newOpened] = await db.insert(openedBottles).values(opened).returning();
    return newOpened;
  }

  async updateOpenedBottle(id: string, userId: string, updates: UpdateOpenedBottleRequest): Promise<OpenedBottle | undefined> {
    const [updated] = await db
      .update(openedBottles)
      .set(updates)
      .where(and(eq(openedBottles.id, id), eq(openedBottles.userId, userId)))
      .returning();
    return updated;
  }

  // --- Stats ---

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Ideally this would be a single optimized query or aggregation
    // For MVP, we'll fetch basic data or use a simplified count if possible.
    // However, status logic ("Drink Soon", "Wait") is complex date math.
    // For now, let's fetch all bottles and compute in memory for simplicity 
    // OR just return placeholder if the dataset is small.
    // Given the prompt asks for "Large counters cards", we should calculate.
    
    const allBottles = await this.getBottles(userId);
    const year = new Date().getFullYear();

    const stats: DashboardStats = {
      openNow: 0,
      peak: 0,
      drinkSoon: 0,
      wait: 0,
      possiblyPast: 0,
      toVerify: 0,
    };

    for (const b of allBottles) {
      if (!b.quantity || b.quantity <= 0) {
        continue;
      }
      const { status } = computeBottleStatus(b, year);
      switch (status) {
        case "to_verify":
          stats.toVerify++;
          break;
        case "wait":
          stats.wait++;
          break;
        case "peak":
          stats.peak++;
          stats.openNow++;
          break;
        case "drink_soon":
          stats.drinkSoon++;
          break;
        case "ready":
        case "ready_before_peak":
        case "ready_after_peak":
          stats.openNow++;
          break;
        case "possibly_past":
          stats.possiblyPast++;
          break;
        default:
          stats.openNow++;
      }
    }
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
