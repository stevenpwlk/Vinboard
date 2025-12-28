import { useRoute, useLocation } from "wouter";
import { useBottle, useUpdateBottle } from "@/hooks/use-bottles";
import { useCreateOpenedBottle } from "@/hooks/use-opened";
import { WineIcon } from "@/components/WineIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Minus, Plus, Wine, Calendar, Tag, MapPin, DollarSign, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Reusing status logic again - simplified
const getStatus = (bottle: any): string => {
  const currentYear = new Date().getFullYear();
  const start = bottle.windowStartYear;
  const end = bottle.windowEndYear;
  if (!start || !end) return "to_verify";
  if (currentYear < start) return "wait";
  if (currentYear <= end) return "open_now";
  return "possibly_past";
};

export default function BottleDetail() {
  const [, params] = useRoute("/bottles/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params?.id || "";
  
  const { data: bottle, isLoading } = useBottle(id);
  const updateMutation = useUpdateBottle();
  const openMutation = useCreateOpenedBottle();
  
  const [isOpening, setIsOpening] = useState(false);

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!bottle) return <div className="p-8 text-center">Bottle not found</div>;

  const handleOpenBottle = async () => {
    setIsOpening(true);
    try {
      // 1. Create opened record
      await openMutation.mutateAsync({
        userId: bottle.userId,
        bottleId: bottle.id,
        externalKey: bottle.externalKey,
        producer: bottle.producer,
        wine: bottle.wine,
        vintage: bottle.vintage,
        quantityOpened: 1,
        rating100: null,
        tastingNotes: ""
      });

      // 2. Decrement quantity
      const newQty = (bottle.quantity || 1) - 1;
      await updateMutation.mutateAsync({ 
        id: bottle.id, 
        quantity: newQty 
      });

      toast({
        title: "Bottle Opened",
        description: "Enjoy! Don't forget to add tasting notes.",
      });

      if (newQty <= 0) {
        setLocation("/bottles"); // Redirect if gone
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to process opening.",
        variant: "destructive"
      });
    } finally {
      setIsOpening(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const current = bottle.quantity || 0;
    const next = current + delta;
    if (next < 0) return;
    updateMutation.mutate({ id: bottle.id, quantity: next });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in-fade space-y-6">
      <button 
        onClick={() => window.history.back()} 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
               <div className="w-24 h-24 rounded-2xl bg-background border border-border flex items-center justify-center shadow-inner">
                 <WineIcon color={bottle.color} type={bottle.type} className="w-12 h-12 scale-150" />
               </div>
            </div>
            
            <div className="flex-1 space-y-2">
               <div className="flex flex-wrap gap-2 mb-2">
                 <StatusBadge status={getStatus(bottle)} />
                 <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium uppercase tracking-wider">
                   {bottle.type || "Unknown Type"}
                 </span>
               </div>
               <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                 {bottle.wine}
               </h1>
               <p className="text-xl text-muted-foreground">{bottle.producer}</p>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-muted/30 rounded-xl p-4 border border-border/50 min-w-[100px]">
               <span className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Vintage</span>
               <span className="text-3xl font-display font-bold text-primary">{bottle.vintage || "NV"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">In Stock:</span>
          <div className="flex items-center bg-background rounded-lg border border-border">
            <button 
              onClick={() => handleQuantityChange(-1)}
              disabled={!bottle.quantity}
              className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-mono font-bold">{bottle.quantity}</span>
            <button 
              onClick={() => handleQuantityChange(1)}
              className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={handleOpenBottle}
          disabled={isOpening || !bottle.quantity}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Wine className="w-4 h-4" />
          {isOpening ? "Opening..." : "Open Bottle"}
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Origin
            </h3>
            <div className="space-y-3">
              <DetailRow label="Country" value={bottle.country} />
              <DetailRow label="Region" value={bottle.region} />
              <DetailRow label="Appellation" value={bottle.appellation} />
              <DetailRow label="Grapes" value={bottle.grapes} />
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Valuation
            </h3>
            <div className="space-y-3">
              <DetailRow label="Market Price" value={bottle.priceTypicalEur ? `€${bottle.priceTypicalEur}` : undefined} />
              <DetailRow label="Min Price" value={bottle.priceMinEur ? `€${bottle.priceMinEur}` : undefined} />
              <DetailRow label="Max Price" value={bottle.priceMaxEur ? `€${bottle.priceMaxEur}` : undefined} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
             <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Drink Window
            </h3>
            <div className="space-y-3">
              <DetailRow label="Window" value={`${bottle.windowStartYear || "?"} - ${bottle.windowEndYear || "?"}`} />
              <DetailRow label="Peak" value={`${bottle.peakStartYear || "?"} - ${bottle.peakEndYear || "?"}`} />
              <DetailRow label="Source" value={bottle.windowSource} />
              <div className="pt-2">
                 <div className="text-xs text-muted-foreground mb-1">Status</div>
                 <StatusBadge status={getStatus(bottle)} />
              </div>
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
             <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Details
            </h3>
            <div className="space-y-3">
               <DetailRow label="Alcohol" value={bottle.abv ? `${bottle.abv}%` : undefined} />
               <DetailRow label="Size" value={bottle.sizeMl ? `${bottle.sizeMl}ml` : undefined} />
               <DetailRow label="Location" value={bottle.location} />
               <DetailRow label="Bin" value={bottle.bin} />
               {bottle.notes && (
                 <div className="pt-2">
                   <div className="text-sm text-muted-foreground font-medium mb-1">Notes</div>
                   <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/50 italic">
                     "{bottle.notes}"
                   </p>
                 </div>
               )}
            </div>
          </section>
        </div>
      </div>

      <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <Accordion type="single" collapsible>
          <AccordionItem value="legacy">
            <AccordionTrigger>Legacy data</AccordionTrigger>
            <AccordionContent>
              {bottle.legacyJson ? (
                <pre className="text-xs whitespace-pre-wrap rounded-lg bg-muted/40 p-4 border border-border/60">
                  {JSON.stringify(bottle.legacyJson, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No legacy data available.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: any }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
