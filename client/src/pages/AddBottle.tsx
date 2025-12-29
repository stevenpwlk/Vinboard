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
import { mapColorLabel, mapTypeLabel, t } from "@/i18n";

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
      
      toast({ title: t("add.toastSuccess"), description: t("add.toastSuccessDesc") });
      setLocation("/bottles");
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: t("common.error"), 
        description: err.message || t("add.toastError"), 
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
          <ArrowLeft className="w-4 h-4" /> {t("common.cancel")}
        </button>
        <h1 className="text-xl font-display font-bold">{t("add.title")}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="identity">
              <AccordionTrigger>{t("add.identity")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.externalKey")}</label>
                    <input {...form.register("externalKey")} className="input-styled" placeholder={t("add.externalKeyPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.producer")}</label>
                    <input {...form.register("producer")} className="input-styled" placeholder={t("add.producerPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.wine")}</label>
                    <input {...form.register("wine")} className="input-styled" placeholder={t("add.winePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.vintage")}</label>
                    <input {...form.register("vintage")} className="input-styled" placeholder={t("add.vintagePlaceholder")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="origin">
              <AccordionTrigger>{t("add.origin")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.country")}</label>
                    <input {...form.register("country")} className="input-styled" placeholder={t("add.countryPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.region")}</label>
                    <input {...form.register("region")} className="input-styled" placeholder={t("add.regionPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.appellation")}</label>
                    <input {...form.register("appellation")} className="input-styled" placeholder={t("add.appellationPlaceholder")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="characteristics">
              <AccordionTrigger>{t("add.characteristics")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.color")}</label>
                    <select {...form.register("color")} className="input-styled appearance-none">
                      <option value="">{t("add.select")}</option>
                      <option value="red">{mapColorLabel("red")}</option>
                      <option value="white">{mapColorLabel("white")}</option>
                      <option value="rose">{mapColorLabel("rose")}</option>
                      <option value="sparkling">{mapColorLabel("sparkling")}</option>
                      <option value="fortified">{mapColorLabel("fortified")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.type")}</label>
                    <select {...form.register("type")} className="input-styled appearance-none">
                      <option value="">{t("add.select")}</option>
                      <option value="still">{mapTypeLabel("still")}</option>
                      <option value="sparkling">{mapTypeLabel("sparkling")}</option>
                      <option value="fortified">{mapTypeLabel("fortified")}</option>
                      <option value="sweet">{mapTypeLabel("sweet")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.size")}</label>
                    <input {...form.register("sizeMl")} className="input-styled" placeholder="750" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.grapes")}</label>
                    <input {...form.register("grapes")} className="input-styled" placeholder="Pinot Noir" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.abv")}</label>
                    <input {...form.register("abv")} className="input-styled" placeholder="13.5" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.barcode")}</label>
                    <input {...form.register("barcode")} className="input-styled" placeholder="EAN / UPC" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="storage">
              <AccordionTrigger>{t("add.storage")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.quantity")}</label>
                    <input {...form.register("quantity")} className="input-styled" placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.location")}</label>
                    <input {...form.register("location")} className="input-styled" placeholder={t("add.locationPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.bin")}</label>
                    <input {...form.register("bin")} className="input-styled" placeholder={t("add.binPlaceholder")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="window">
              <AccordionTrigger>{t("add.window")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.windowStart")}</label>
                    <input {...form.register("windowStartYear")} className="input-styled" placeholder="2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.windowEnd")}</label>
                    <input {...form.register("windowEndYear")} className="input-styled" placeholder="2030" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.peakStart")}</label>
                    <input {...form.register("peakStartYear")} className="input-styled" placeholder="2026" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.peakEnd")}</label>
                    <input {...form.register("peakEndYear")} className="input-styled" placeholder="2028" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.windowSource")}</label>
                    <input {...form.register("windowSource")} className="input-styled" placeholder={t("add.windowSourcePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.confidence")}</label>
                    <input {...form.register("confidence")} className="input-styled" placeholder={t("add.confidencePlaceholder")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service">
              <AccordionTrigger>{t("add.service")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.servingTemp")}</label>
                    <input {...form.register("servingTempC")} className="input-styled" placeholder="16" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.decanting")}</label>
                    <input {...form.register("decanting")} className="input-styled" placeholder={t("add.decantingPlaceholder")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing">
              <AccordionTrigger>{t("add.pricing")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.priceMin")}</label>
                    <input {...form.register("priceMinEur")} className="input-styled" placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.priceTypical")}</label>
                    <input {...form.register("priceTypicalEur")} className="input-styled" placeholder="15" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.priceMax")}</label>
                    <input {...form.register("priceMaxEur")} className="input-styled" placeholder="20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.priceUpdatedAt")}</label>
                    <input {...form.register("priceUpdatedAt")} className="input-styled" placeholder={t("add.priceUpdatedAtPlaceholder")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes">
              <AccordionTrigger>{t("add.notes")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.notesLabel")}</label>
                    <textarea {...form.register("notes")} className="input-styled min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.sources")}</label>
                    <textarea {...form.register("sourcesText")} className="input-styled min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("add.priceSources")}</label>
                    <textarea {...form.register("priceSourcesText")} className="input-styled min-h-[80px]" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...form.register("addToExisting")} />
            <span className="text-sm text-muted-foreground">
              {t("add.addToExisting")}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLocation("/bottles")}
            className="flex-1 py-4 border border-border rounded-xl text-foreground font-semibold"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isPending ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
