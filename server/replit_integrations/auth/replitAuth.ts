import session from "express-session";
import type { Express, RequestHandler, Request, Response } from "express";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
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
      secure: process.env.NODE_ENV === "production",
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

type ProviderName = "google" | "github" | "apple";

type OAuthProviderConfig = {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  userInfoUrl: string;
};

function getProviderConfig(provider: ProviderName): OAuthProviderConfig | null {
  if (provider === "google") {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return null;
    }
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    };
  }

  if (provider === "github") {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return null;
    }

    return {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scope: "user:email",
      userInfoUrl: "https://api.github.com/user",
    };
  }

  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_CLIENT_SECRET) {
    return null;
  }

  return {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    scope: "name email",
    userInfoUrl: "https://appleid.apple.com/auth/userinfo",
  };
}

function resolveAppBaseUrl(req: { protocol: string; get: (header: string) => string | undefined }) {
  return process.env.APP_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
}

function createState() {
  return crypto.randomBytes(16).toString("hex");
}

async function fetchGoogleUser(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Google user.");
  }
  const profile = await response.json();
  return {
    id: `google:${profile.sub}`,
    email: profile.email ?? null,
    firstName: profile.given_name ?? null,
    lastName: profile.family_name ?? null,
    profileImageUrl: profile.picture ?? null,
  };
}

async function fetchGitHubEmails(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

async function fetchGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user.");
  }
  const profile = await response.json();
  let email = profile.email ?? null;
  if (!email) {
    const emails = await fetchGitHubEmails(accessToken);
    const primary = emails.find((entry: any) => entry.primary && entry.verified);
    email = primary?.email ?? emails[0]?.email ?? null;
  }
  const nameParts = profile.name?.split(" ") ?? [];
  return {
    id: `github:${profile.id}`,
    email,
    firstName: nameParts[0] ?? null,
    lastName: nameParts.slice(1).join(" ") || null,
    profileImageUrl: profile.avatar_url ?? null,
  };
}

async function fetchAppleUser(accessToken: string) {
  const response = await fetch("https://appleid.apple.com/auth/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Apple user.");
  }
  const profile = await response.json();
  return {
    id: `apple:${profile.sub}`,
    email: profile.email ?? null,
    firstName: profile.name?.firstName ?? null,
    lastName: profile.name?.lastName ?? null,
    profileImageUrl: null,
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  const startLogin = (provider: ProviderName, req: Request, res: Response) => {
    if (!["google", "github", "apple"].includes(provider)) {
      res.status(400).json({ message: "Unsupported provider" });
      return;
    }
    const config = getProviderConfig(provider);
    if (!config) {
      res.status(500).json({ message: "OAuth provider is not configured" });
      return;
    }
    const state = createState();
    (req.session as any).oauthState = { provider, value: state, createdAt: Date.now() };
    const appBaseUrl = resolveAppBaseUrl(req);
    const callbackUrl = `${appBaseUrl}/api/callback/${provider}`;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: config.scope,
      state,
    });
    if (provider === "apple") {
      params.set("response_mode", "query");
    }
    res.redirect(`${config.authorizeUrl}?${params.toString()}`);
  };

  app.get("/api/login/:provider", (req, res) => {
    startLogin(req.params.provider as ProviderName, req, res);
  });

  app.get("/api/login", (req, res) => {
    const provider = process.env.GOOGLE_CLIENT_ID
      ? "google"
      : process.env.GITHUB_CLIENT_ID
      ? "github"
      : "apple";
    startLogin(provider, req, res);
  });

  app.get("/api/callback/:provider", async (req, res) => {
    const provider = req.params.provider as ProviderName;
    if (!["google", "github", "apple"].includes(provider)) {
      res.status(400).json({ message: "Unsupported provider" });
      return;
    }
    try {
      const config = getProviderConfig(provider);
      if (!config) {
        res.status(500).json({ message: "OAuth provider is not configured" });
        return;
      }
      const state = req.query.state as string | undefined;
      const code = req.query.code as string | undefined;
      const storedState = (req.session as any).oauthState;
      if (!state || !code || !storedState || storedState.value !== state) {
        res.status(400).json({ message: "Invalid OAuth state" });
        return;
      }

      const appBaseUrl = resolveAppBaseUrl(req);
      const callbackUrl = `${appBaseUrl}/api/callback/${provider}`;
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });
      const tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: tokenParams.toString(),
      });
      if (!tokenResponse.ok) {
        res.status(401).json({ message: "OAuth token exchange failed" });
        return;
      }
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        res.status(401).json({ message: "Missing OAuth access token" });
        return;
      }

      const user =
        provider === "google"
          ? await fetchGoogleUser(accessToken)
          : provider === "github"
          ? await fetchGitHubUser(accessToken)
          : await fetchAppleUser(accessToken);
      await upsertUser(user);
      (req.session as any).userId = user.id;
      delete (req.session as any).oauthState;
      res.redirect("/");
    } catch (error) {
      console.error("OAuth callback failed:", error);
      res.status(500).json({ message: "OAuth callback failed" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  (req as any).user = { id: (req.session as any).userId };
  return next();
};
