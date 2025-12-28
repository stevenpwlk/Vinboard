import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Wine } from "lucide-react";
import { useState } from "react";

export default function Auth() {
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const requestMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to send magic link.");
      }
      setMessage("Check your email for the login link.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send magic link.";
      setMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Hero Section */}
      <div className="relative flex-1 bg-primary text-primary-foreground flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
        
        {/* Abstract Wine Art Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 max-w-md text-center md:text-left">
          <div className="mb-6 inline-flex p-4 bg-white/10 rounded-2xl backdrop-blur-sm shadow-xl">
            <Wine className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Curate Your Collection
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 font-light leading-relaxed">
            Vinboard is the minimalist cellar manager for the modern collector. Track provenance, drink windows, and tasting notes with elegance.
          </p>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your cellar.</p>
          </div>

          <div className="space-y-4">
            <form onSubmit={requestMagicLink} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              >
                {isSending ? "Sending link..." : "Send magic link"}
              </button>
            </form>

            {message ? (
              <p className="text-sm text-center text-muted-foreground">{message}</p>
            ) : null}

            <p className="text-xs text-center text-muted-foreground mt-8">
              We’ll email you a one-time sign-in link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
