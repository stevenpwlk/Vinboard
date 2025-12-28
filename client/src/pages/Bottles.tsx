import { useState } from "react";
import { useBottles, type BottlesFilters } from "@/hooks/use-bottles";
import { BottleCard } from "@/components/BottleCard";
import { Search, Filter, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

// Status logic replication (see Home.tsx note)
const getStatus = (bottle: any): string => {
  const currentYear = new Date().getFullYear();
  const start = bottle.windowStartYear;
  const end = bottle.windowEndYear;
  const peakStart = bottle.peakStartYear;
  const peakEnd = bottle.peakEndYear;

  if (!start || !end) return "to_verify";
  if (currentYear < start) return "wait";
  if (peakStart && peakEnd && currentYear >= peakStart && currentYear <= peakEnd) return "open_now";
  if (currentYear <= end && (end - currentYear <= 1)) return "drink_soon";
  if (currentYear <= end) return "open_now";
  return "possibly_past";
};

export default function Bottles() {
  const [location] = useLocation();
  // Parse initial query params roughly
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState<BottlesFilters>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    color: searchParams.get("color") || "",
  });

  const { data: bottles, isLoading } = useBottles(filters);

  // Simple debounce for search input could be added, but relying on state for now
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const toggleFilter = (key: keyof BottlesFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? "" : value
    }));
  };

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Cellar</h2>
          <p className="text-muted-foreground">{bottles?.length || 0} bottles in collection</p>
        </div>
        <Link href="/add" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all">
          Add Bottle
        </Link>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search wine, producer, vintage..."
            className="input-styled pl-10"
            value={filters.search}
            onChange={handleSearch}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["Red", "White", "Sparkling", "Rose", "Fortified"].map(color => (
            <button
              key={color}
              onClick={() => toggleFilter("color", color)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                filters.color === color
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {color}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          {["open_now", "drink_soon", "wait"].map(status => (
             <button
              key={status}
              onClick={() => toggleFilter("status", status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border capitalize",
                filters.status === status
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-card animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      ) : bottles && bottles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bottles.map((bottle) => (
            <BottleCard key={bottle.id} bottle={bottle} status={getStatus(bottle)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-muted mb-4">
            <Filter className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground">No bottles found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
          <button 
            onClick={() => setFilters({})}
            className="mt-4 text-primary font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
