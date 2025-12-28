import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

// Pages
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Bottles from "@/pages/Bottles";
import BottleDetail from "@/pages/BottleDetail";
import AddBottle from "@/pages/AddBottle";
import Import from "@/pages/Import";
import History from "@/pages/History";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      
      <Route path="/bottles">
        <ProtectedRoute component={Bottles} />
      </Route>
      
      <Route path="/bottles/:id">
        <ProtectedRoute component={BottleDetail} />
      </Route>

      <Route path="/add">
        <ProtectedRoute component={AddBottle} />
      </Route>
      
      <Route path="/import">
        <ProtectedRoute component={Import} />
      </Route>
      
      <Route path="/history">
        <ProtectedRoute component={History} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
