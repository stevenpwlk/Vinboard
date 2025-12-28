import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateBottle } from "@/hooks/use-bottles";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { importBottleSchema } from "@shared/schema";

// Form schema based on import schema but suitable for single entry
const formSchema = importBottleSchema.omit({ 
  external_key: true,
  price_sources: true,
  sources: true,
  price_checked_date: true
});

type FormData = z.infer<typeof formSchema>;

export default function AddBottle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutateAsync: createBottle, isPending } = useCreateBottle();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      color: "red",
      type: "still"
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Generate a temporary external key if not provided (backend might require it based on schema)
      // The schema says externalKey is NOT NULL, so we must provide it.
      // Usually externalKey comes from import source. For manual entry, we generate one.
      const payload = {
        ...data,
        external_key: `manual_${Date.now()}`,
        // Map snake_case to camelCase handled by zod parser in shared schema?
        // Wait, insertBottleSchema expects camelCase, importBottleSchema expects snake_case.
        // My hook uses insertBottleSchema for creation which is camelCase.
        // Let's manually map or adjust the hook to use correct types.
        // Actually, the hook uses `api.bottles.create.input` which is `insertBottleSchema`.
        // `insertBottleSchema` is from drizzle-zod, so it uses camelCase matching DB columns.
        
        // Let's fix the form data mapping manually here to match `InsertBottle`
        externalKey: `manual_${Date.now()}`,
        producer: data.producer,
        wine: data.wine,
        vintage: data.vintage,
        color: data.color,
        type: data.type,
        quantity: data.quantity,
        country: data.country,
        region: data.region,
        appellation: data.appellation,
        sizeMl: data.size_ml,
        abv: data.abv,
        grapes: Array.isArray(data.grapes) ? data.grapes.join(", ") : data.grapes, // Schema is text for grapes
        notes: data.notes,
        location: data.location,
        bin: data.bin,
        windowStartYear: data.window_start_year,
        windowEndYear: data.window_end_year,
        peakStartYear: data.peak_start_year,
        peakEndYear: data.peak_end_year,
        priceTypicalEur: data.price_typical_eur
      };

      await createBottle(payload as any); // Casting because I did manual mapping above
      
      toast({ title: "Bottle Added", description: "Successfully added to cellar." });
      setLocation("/bottles");
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: err.message || "Failed to create bottle", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in-fade">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
        <h1 className="text-xl font-display font-bold">Add New Bottle</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Identity</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Producer *</label>
                <input {...form.register("producer")} className="input-styled" required placeholder="e.g. Domaine Leflaive" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Wine Name *</label>
                <input {...form.register("wine")} className="input-styled" required placeholder="e.g. Puligny-Montrachet" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vintage</label>
                <input {...form.register("vintage")} className="input-styled" placeholder="e.g. 2019" />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Quantity</label>
                 <input 
                   type="number" 
                   {...form.register("quantity", { valueAsNumber: true })} 
                   className="input-styled" 
                   min="1"
                 />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Characteristics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <select {...form.register("color")} className="input-styled appearance-none">
                  <option value="red">Red</option>
                  <option value="white">White</option>
                  <option value="rose">Rosé</option>
                  <option value="sparkling">Sparkling</option>
                  <option value="fortified">Fortified</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <input {...form.register("region")} className="input-styled" placeholder="e.g. Burgundy" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Drink Window</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Year</label>
                <input type="number" {...form.register("window_start_year", { valueAsNumber: true })} className="input-styled" placeholder="YYYY" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Year</label>
                <input type="number" {...form.register("window_end_year", { valueAsNumber: true })} className="input-styled" placeholder="YYYY" />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isPending ? "Saving..." : "Save Bottle"}
        </button>
      </form>
    </div>
  );
}
