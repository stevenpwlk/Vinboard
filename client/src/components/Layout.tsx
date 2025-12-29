import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Wine, History, LogOut, Upload, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: t("nav.home"), href: "/" },
    { icon: Wine, label: t("nav.cellar"), href: "/bottles" },
    { icon: History, label: t("nav.history"), href: "/history" },
    { icon: Upload, label: t("nav.import"), href: "/import" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar / Mobile Top Bar Placeholder */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
        <div className="p-8">
          <h1 className="text-3xl font-display font-bold text-primary">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("app.tagline")}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName || t("user.fallback")}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
              title={t("auth.signOut")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border sticky top-0 z-40">
        <h1 className="text-xl font-display font-bold text-primary">{t("app.name")}</h1>
        <button 
          onClick={() => logout()}
          className="p-2 text-muted-foreground hover:text-primary"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-5xl mx-auto p-4 pb-24 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-50 pb-safe">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className={cn("w-6 h-6", isActive && "fill-current/10")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
