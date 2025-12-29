import { useDashboardStats, useBottles } from "@/hooks/use-bottles";
import { Link } from "wouter";
import { BottleCard } from "@/components/BottleCard";
import { ArrowRight, Clock, CheckCircle2, AlertCircle, Hourglass, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeBottleStatus } from "@shared/status";

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  colorClass, 
  href 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  colorClass: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className={cn(
        "bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between",
        "hover:border-primary/20"
      )}>
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
            {value || 0}
          </p>
        </div>
        <div className={cn("p-3 rounded-full opacity-80 group-hover:opacity-100 transition-opacity", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  
  // Fetch a few 'Drink Soon' or 'Open Now' bottles for the quick list
  // Ideally we'd filter this query, but useBottles takes filters
  const { data: readyBottles, isLoading: bottlesLoading } = useBottles({ status: "ready", sort: "vintage" });

  if (statsLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8 animate-in-fade">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground">Your cellar at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          label="Ready" 
          value={stats?.openNow || 0} 
          icon={CheckCircle2} 
          colorClass="bg-emerald-100 text-emerald-700"
          href="/bottles?status=ready"
        />
        <StatCard 
          label="Peak" 
          value={stats?.peak || 0} 
          icon={Star} 
          colorClass="bg-purple-100 text-purple-700"
          href="/bottles?status=peak"
        />
        <StatCard 
          label="Drink Soon" 
          value={stats?.drinkSoon || 0} 
          icon={AlertCircle} 
          colorClass="bg-orange-100 text-orange-700"
          href="/bottles?status=drink_soon"
        />
        <StatCard 
          label="Wait" 
          value={stats?.wait || 0} 
          icon={Hourglass} 
          colorClass="bg-blue-100 text-blue-700"
          href="/bottles?status=wait"
        />
        <StatCard 
          label="Past Peak" 
          value={stats?.possiblyPast || 0} 
          icon={Clock} 
          colorClass="bg-red-100 text-red-700"
          href="/bottles?status=possibly_past"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold">Ready to Drink</h3>
          <Link href="/bottles?status=ready" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {bottlesLoading ? (
          <div className="h-40 bg-card/50 animate-pulse rounded-xl" />
        ) : readyBottles && readyBottles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyBottles.slice(0, 3).map((bottle) => (
              <BottleCard
                key={bottle.id}
                bottle={bottle}
                status={(bottle as any).status || computeBottleStatus(bottle).status}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No bottles currently marked as ready.</p>
            <Link href="/import" className="text-primary font-medium mt-2 inline-block">Import bottles</Link>
          </div>
        )}
      </div>
    </div>
  );
}
