import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Authentication is disabled</h1>
        <p className="text-muted-foreground">
          You should be redirected automatically. If not, go back to the app.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to Vinboard
        </a>
      </div>
    </div>
  );
}
