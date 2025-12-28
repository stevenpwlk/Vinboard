import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(user: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}) {
  await authStorage.upsertUser({
    id: user.id,
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL must be set for OAuth callbacks.");
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${appBaseUrl}/api/callback/google`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value ?? null;
          const user = {
            id: `google:${profile.id}`,
            email,
            firstName: profile.name?.givenName ?? null,
            lastName: profile.name?.familyName ?? null,
            profileImageUrl: profile.photos?.[0]?.value ?? null,
          };
          await upsertUser(user);
          done(null, { claims: { sub: user.id } });
        }
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${appBaseUrl}/api/callback/github`,
          scope: ["user:email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value ?? null;
          const nameParts = profile.displayName?.split(" ") ?? [];
          const user = {
            id: `github:${profile.id}`,
            email,
            firstName: nameParts[0] ?? null,
            lastName: nameParts.slice(1).join(" ") || null,
            profileImageUrl: profile.photos?.[0]?.value ?? null,
          };
          await upsertUser(user);
          done(null, { claims: { sub: user.id } });
        }
      )
    );
  }

  app.get("/api/login/:provider", (req, res, next) => {
    const provider = req.params.provider;
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider" });
    }
    passport.authenticate(provider)(req, res, next);
  });

  app.get("/api/callback/:provider", (req, res, next) => {
    const provider = req.params.provider;
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider" });
    }
    passport.authenticate(provider, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login/google",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
