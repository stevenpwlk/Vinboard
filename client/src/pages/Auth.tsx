import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function Auth() {
  const { isAuthenticated, isLoading } = useAuth();

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
