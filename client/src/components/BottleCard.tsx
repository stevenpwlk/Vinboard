import { type Bottle } from "@shared/schema";
import { Link } from "wouter";
import { WineIcon } from "./WineIcon";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { MapPin, Calendar, Star } from "lucide-react";
import { computeBottleStatus } from "@shared/status";

interface BottleCardProps {
  bottle: Bottle;
  status: string; // Calculated status passed from parent
}

export function BottleCard({ bottle, status }: BottleCardProps) {
  const computed = computeBottleStatus(bottle);
  const windowLabel = (bottle as any).windowLabel || computed.windowLabel;
  const peakLabel = (bottle as any).peakLabel || computed.peakLabel;

  return (
    <Link href={`/bottles/${bottle.id}`} className="block group">
      <div className="wine-card p-4 relative h-full flex flex-col hover:-translate-y-1 transition-transform">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <WineIcon color={bottle.color} type={bottle.type} className="w-10 h-10" />
            <div>
              <h3 className="font-display font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                {bottle.wine || "Unknown Wine"}
              </h3>
              <p className="text-sm text-muted-foreground">{bottle.producer}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-lg font-bold text-primary/80">
              {bottle.vintage || "NV"}
            </span>
            <div className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-md">
              Qty: {bottle.quantity}
            </div>
          </div>
        </div>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {bottle.country && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {bottle.country}
              </span>
            )}
            {bottle.region && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{bottle.region}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <StatusBadge status={status} />
            {windowLabel ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Calendar className="w-3 h-3" />
                <span>{windowLabel}</span>
              </div>
            ) : null}
          </div>
          {peakLabel ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Star className="w-3 h-3" />
              <span>{peakLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
