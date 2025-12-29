import { useLocation } from "wouter";
import { useCreateBottle } from "@/hooks/use-bottles";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const nullishString = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  if (!str || str.toLowerCase() === "nan") return undefined;
  return str;
}, z.string().optional());

const parseNumber = (value: string) => {
  const normalized = value.replace("%", "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const nullishNumber = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") return parseNumber(value);
  return undefined;
}, z.number().optional());

const nullishInt = z.preprocess((value) => {
  const parsed = nullishNumber.parse(value);
  if (parsed === undefined) return undefined;
  return Math.trunc(parsed);
}, z.number().int().optional());

const formSchema = z.object({
  externalKey: nullishString,
  producer: nullishString,
  wine: nullishString,
  vintage: nullishString,
  country: nullishString,
  region: nullishString,
  appellation: nullishString,
  color: nullishString,
  type: nullishString,
  sizeMl: nullishInt,
  grapes: nullishString,
  abv: nullishNumber,
  barcode: nullishString,
  quantity: nullishInt.default(1),
  location: nullishString,
  bin: nullishString,
  windowStartYear: nullishInt,
  peakStartYear: nullishInt,
  peakEndYear: nullishInt,
  windowEndYear: nullishInt,
  windowSource: nullishString,
  confidence: nullishString,
  servingTempC: nullishNumber,
  decanting: nullishString,
  priceMinEur: nullishNumber,
  priceTypicalEur: nullishNumber,
  priceMaxEur: nullishNumber,
  priceUpdatedAt: nullishString,
  notes: nullishString,
  sourcesText: nullishString,
  priceSourcesText: nullishString,
  addToExisting: z.boolean().optional(),
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
      const sources =
        data.sourcesText?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
      const priceSources =
        data.priceSourcesText?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];

      const payload = {
        externalKey: data.externalKey,
        producer: data.producer,
        wine: data.wine,
        vintage: data.vintage,
        country: data.country,
        region: data.region,
        appellation: data.appellation,
        color: data.color,
        type: data.type,
        sizeMl: data.sizeMl,
        grapes: data.grapes,
        abv: data.abv,
        barcode: data.barcode,
        quantity: data.quantity,
        location: data.location,
        bin: data.bin,
        windowStartYear: data.windowStartYear,
        peakStartYear: data.peakStartYear,
        peakEndYear: data.peakEndYear,
        windowEndYear: data.windowEndYear,
        windowSource: data.windowSource,
        confidence: data.confidence,
        servingTempC: data.servingTempC,
        decanting: data.decanting,
        priceMinEur: data.priceMinEur,
        priceTypicalEur: data.priceTypicalEur,
        priceMaxEur: data.priceMaxEur,
        priceUpdatedAt: data.priceUpdatedAt ? new Date(data.priceUpdatedAt) : undefined,
        notes: data.notes,
        sourcesJson: sources.length ? sources : undefined,
        priceSourcesJson: priceSources.length ? priceSources : undefined,
      };

      await createBottle({ ...payload, addToExisting: data.addToExisting } as any);
      
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
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="identity">
              <AccordionTrigger>Identity</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">External key</label>
                    <input {...form.register("externalKey")} className="input-styled" placeholder="Optional external key" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Producer</label>
                    <input {...form.register("producer")} className="input-styled" placeholder="e.g. Domaine Leflaive" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wine Name</label>
                    <input {...form.register("wine")} className="input-styled" placeholder="e.g. Puligny-Montrachet" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vintage</label>
                    <input {...form.register("vintage")} className="input-styled" placeholder="e.g. 2019" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="origin">
              <AccordionTrigger>Origin</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <input {...form.register("country")} className="input-styled" placeholder="e.g. France" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Region</label>
                    <input {...form.register("region")} className="input-styled" placeholder="e.g. Burgundy" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Appellation</label>
                    <input {...form.register("appellation")} className="input-styled" placeholder="e.g. Puligny-Montrachet" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="characteristics">
              <AccordionTrigger>Characteristics</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <select {...form.register("color")} className="input-styled appearance-none">
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="white">White</option>
                      <option value="rose">Rosé</option>
                      <option value="sparkling">Sparkling</option>
                      <option value="fortified">Fortified</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select {...form.register("type")} className="input-styled appearance-none">
                      <option value="">Select</option>
                      <option value="still">Still</option>
                      <option value="sparkling">Sparkling</option>
                      <option value="fortified">Fortified</option>
                      <option value="sweet">Sweet</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size (ml)</label>
                    <input {...form.register("sizeMl")} className="input-styled" placeholder="750" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grapes</label>
                    <input {...form.register("grapes")} className="input-styled" placeholder="Pinot Noir" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ABV (%)</label>
                    <input {...form.register("abv")} className="input-styled" placeholder="13.5" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barcode</label>
                    <input {...form.register("barcode")} className="input-styled" placeholder="EAN / UPC" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="storage">
              <AccordionTrigger>Cellar / Storage</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <input {...form.register("quantity")} className="input-styled" placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input {...form.register("location")} className="input-styled" placeholder="e.g. Basement" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bin</label>
                    <input {...form.register("bin")} className="input-styled" placeholder="e.g. A3" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="window">
              <AccordionTrigger>Drinking window & Peak</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Window start year</label>
                    <input {...form.register("windowStartYear")} className="input-styled" placeholder="2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Window end year</label>
                    <input {...form.register("windowEndYear")} className="input-styled" placeholder="2030" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peak start year</label>
                    <input {...form.register("peakStartYear")} className="input-styled" placeholder="2026" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peak end year</label>
                    <input {...form.register("peakEndYear")} className="input-styled" placeholder="2028" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Window source</label>
                    <input {...form.register("windowSource")} className="input-styled" placeholder="e.g. Producer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confidence</label>
                    <input {...form.register("confidence")} className="input-styled" placeholder="high / medium / low" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service">
              <AccordionTrigger>Service</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Serving temperature (°C)</label>
                    <input {...form.register("servingTempC")} className="input-styled" placeholder="16" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Decanting</label>
                    <input {...form.register("decanting")} className="input-styled" placeholder="e.g. 30 min" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing">
              <AccordionTrigger>Pricing</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price min (€)</label>
                    <input {...form.register("priceMinEur")} className="input-styled" placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price typical (€)</label>
                    <input {...form.register("priceTypicalEur")} className="input-styled" placeholder="15" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price max (€)</label>
                    <input {...form.register("priceMaxEur")} className="input-styled" placeholder="20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price updated at</label>
                    <input {...form.register("priceUpdatedAt")} className="input-styled" placeholder="YYYY-MM-DD" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes">
              <AccordionTrigger>Notes & Sources</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea {...form.register("notes")} className="input-styled min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sources (one URL per line)</label>
                    <textarea {...form.register("sourcesText")} className="input-styled min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price sources (one URL per line)</label>
                    <textarea {...form.register("priceSourcesText")} className="input-styled min-h-[80px]" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...form.register("addToExisting")} />
            <span className="text-sm text-muted-foreground">
              Add quantity to existing bottle if external key matches
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLocation("/bottles")}
            className="flex-1 py-4 border border-border rounded-xl text-foreground font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isPending ? "Saving..." : "Save Bottle"}
          </button>
        </div>
      </form>
    </div>
  );
}
