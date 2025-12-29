import { useEffect, useState } from "react";
import { useBottles, type BottlesFilters, useDeleteBottle } from "@/hooks/use-bottles";
import { BottleCard } from "@/components/BottleCard";
import { Search, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { computeBottleStatus } from "@shared/status";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const filterKeys: Array<keyof BottlesFilters> = [
  "q",
  "status",
  "confidence",
  "window_source",
  "color",
  "sweetness",
  "location",
  "sort",
];

const getFiltersFromSearch = (search: string): BottlesFilters => {
  const params = new URLSearchParams(search);
  const filters: BottlesFilters = {};
  filterKeys.forEach((key) => {
    const value = params.get(key);
    if (value) {
      filters[key] = value;
    }
  });
  return filters;
};

const buildSearchFromFilters = (filters: BottlesFilters) => {
  const params = new URLSearchParams();
  filterKeys.forEach((key) => {
    const value = filters[key];
    if (value) {
      params.set(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export default function Bottles() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteBottle = useDeleteBottle();

  const [filters, setFilters] = useState<BottlesFilters>(() =>
    getFiltersFromSearch(window.location.search)
  );

  useEffect(() => {
    const search = location.split("?")[1] ? `?${location.split("?")[1]}` : "";
    setFilters(getFiltersFromSearch(search));
  }, [location]);

  const { data: bottles, isLoading } = useBottles(filters);

  const applyFilters = (nextFilters: BottlesFilters) => {
    setFilters(nextFilters);
    setLocation(`/bottles${buildSearchFromFilters(nextFilters)}`, { replace: true });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFilters({ ...filters, q: e.target.value });
  };

  const toggleFilter = (key: keyof BottlesFilters, value: string) => {
    applyFilters({
      ...filters,
      [key]: filters[key] === value ? "" : value,
    });
  };

  const clearFilters = () => {
    applyFilters({});
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBottle.mutateAsync(id);
      toast({ title: "Bottle deleted", description: "The bottle was removed." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bottle.",
        variant: "destructive",
      });
    }
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
            value={filters.q || ""}
            onChange={handleSearch}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["red", "white", "sparkling", "rose", "fortified"].map(color => (
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
          {["ready", "peak", "drink_soon", "wait", "possibly_past"].map(status => (
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
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Confidence"
            className="input-styled"
            value={filters.confidence || ""}
            onChange={(event) => applyFilters({ ...filters, confidence: event.target.value })}
          />
          <input
            type="text"
            placeholder="Window source"
            className="input-styled"
            value={filters.window_source || ""}
            onChange={(event) => applyFilters({ ...filters, window_source: event.target.value })}
          />
          <input
            type="text"
            placeholder="Location"
            className="input-styled"
            value={filters.location || ""}
            onChange={(event) => applyFilters({ ...filters, location: event.target.value })}
          />
          <input
            type="text"
            placeholder="Sweetness"
            className="input-styled"
            value={filters.sweetness || ""}
            onChange={(event) => applyFilters({ ...filters, sweetness: event.target.value })}
          />
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
          {bottles.map((bottle) => {
            const computed = computeBottleStatus(bottle);
            const status = (bottle as any).status || computed.status;
            return (
              <div key={bottle.id} className="relative">
                <BottleCard bottle={bottle} status={status} />
                <div className="absolute right-3 top-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        type="button"
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this bottle?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the bottle and any history entries.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(bottle.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-muted mb-4">
            <Filter className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground">No bottles found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
          <button 
            onClick={clearFilters}
            className="mt-4 text-primary font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
