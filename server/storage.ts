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
import { eq, and, sql, desc, asc } from "drizzle-orm";

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
    let query = db.select().from(bottles).where(eq(bottles.userId, userId));
    
    // Add filtering logic here if needed based on `filters` object
    // For now, returning all for the user
    
    return await query.orderBy(desc(bottles.createdAt));
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
      drinkSoon: 0,
      wait: 0,
      possiblyPast: 0,
      toVerify: 0,
    };

    for (const b of allBottles) {
      if (b.quantity && b.quantity > 0) {
        if (!b.windowStartYear || !b.windowEndYear) {
          stats.toVerify++;
        } else if (year < b.windowStartYear) {
          stats.wait++;
        } else if (b.peakStartYear && b.peakEndYear && year >= b.peakStartYear && year <= b.peakEndYear) {
          stats.openNow++; // "At peak"
        } else if (year <= b.windowEndYear) {
           if (b.windowEndYear - year <= 1) {
             stats.drinkSoon++; // "Drink fast"
           } else {
             stats.openNow++; // "Ready" -> mapping to openNow for simplicity or split?
             // Prompt says: "Open now (status: ready/peak/drink fast)"
             // So Ready, Peak, Drink Fast all contribute to "Open Now"?
             // Actually, prompt has separate cards: "Open now", "Drink soon", "Wait", "Possibly past", "To verify"
             // And "Status logic":
             // - If window_end - today <= 1 => "Drink fast"
             // - Else "Ready"
             // Let's align stats to cards requested:
             // Open now (Ready/Peak/Drink Fast - maybe Drink Fast is separate?)
             // Let's assume:
             // Open Now = Ready + Peak
             // Drink Soon = Drink Fast (<= 1 year left)
             // Wait = < window start
             // Possibly Past = > window end
          }
        } else {
          stats.possiblyPast++;
        }
      }
    }
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
