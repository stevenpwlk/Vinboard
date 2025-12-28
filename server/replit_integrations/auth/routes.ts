import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { db } from "../../db";
import { magicLinks } from "@shared/models/auth";
import { and, eq, gt, isNull } from "drizzle-orm";
import crypto from "crypto";
import { sendMagicLink } from "./mailer";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/magic-link", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      res.status(400).json({ message: "Invalid email" });
      return;
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(magicLinks).values({
      token,
      email,
      expiresAt,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const link = `${baseUrl}/api/auth/verify?token=${token}`;

    try {
      await sendMagicLink(email, link);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to send magic link:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  app.get("/api/auth/verify", async (req, res) => {
    const token = String(req.query.token || "");
    if (!token) {
      res.status(400).json({ message: "Missing token" });
      return;
    }

    const now = new Date();
    const [record] = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.token, token), isNull(magicLinks.usedAt), gt(magicLinks.expiresAt, now)));

    if (!record) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    let user = await authStorage.getUserByEmail(record.email);
    if (!user) {
      user = await authStorage.createUser(record.email);
    }

    await db
      .update(magicLinks)
      .set({ usedAt: now })
      .where(eq(magicLinks.token, token));

    (req.session as any).userId = user.id;
    res.redirect("/");
  });
}
