import { useEffect, useState } from "react";
import { useImportBottles } from "@/hooks/use-bottles";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { t } from "@/i18n";

export default function Import() {
  const [jsonInput, setJsonInput] = useState("");
  const { mutateAsync: importBottles, isPending } = useImportBottles();
  const { toast } = useToast();
  const [result, setResult] = useState<{ imported: number, updated: number, errors: any[] } | null>(null);
  const [mode, setMode] = useState<"merge" | "sync">("merge");
  const [modeTouched, setModeTouched] = useState(false);

  const detectImportMode = (payload: unknown): "merge" | "sync" => {
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      return "merge";
    }
    const candidate = payload as { schema_version?: unknown; bottles?: unknown };
    if (candidate.schema_version !== undefined && Array.isArray(candidate.bottles)) {
      return "sync";
    }
    return "merge";
  };

  useEffect(() => {
    if (modeTouched || !jsonInput.trim()) {
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setMode(detectImportMode(parsed));
    } catch {
      return;
    }
  }, [jsonInput, modeTouched]);

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await importBottles({ data: parsed, mode });
      setResult({
        imported: res.importedCount,
        updated: res.updatedCount,
        errors: res.errors
      });
      toast({
        title: t("import.toastSuccess"),
        description: t("import.toastSuccessDesc", { count: res.importedCount + res.updatedCount }),
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: t("import.toastError"),
        description: err.message || t("import.toastErrorDesc"),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-fade">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">{t("import.title")}</h2>
        <p className="text-muted-foreground">{t("import.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> {t("import.input")}
            </h3>
            <textarea
              className="w-full h-96 p-4 font-mono text-xs bg-muted/30 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder={`[\n  {\n    "external_key": "unique_id_1",\n    "producer": "Chateau Margaux",\n    "wine": "Premier Grand Cru Classé",\n    "vintage": "2015",\n    "quantity": 3\n  }\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground">{t("import.modeLabel")}</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as "merge" | "sync");
                  setModeTouched(true);
                }}
              >
                <option value="merge">{t("import.modeMerge")}</option>
                <option value="sync">{t("import.modeSync")}</option>
              </select>
              <p className="text-xs text-muted-foreground">{t("import.modeHint")}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleImport}
                disabled={isPending || !jsonInput}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isPending ? t("import.processing") : t("import.process")}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full">
            <h3 className="font-medium mb-4">{t("import.results")}</h3>
            {result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 text-center">
                    <div className="text-2xl font-bold">{result.imported}</div>
                    <div className="text-xs font-medium uppercase tracking-wide opacity-80">{t("import.new")}</div>
                  </div>
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-center">
                    <div className="text-2xl font-bold">{result.updated}</div>
                    <div className="text-xs font-medium uppercase tracking-wide opacity-80">{t("import.updated")}</div>
                  </div>
                </div>

                {result.errors.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {t("import.errors")} ({result.errors.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {result.errors.map((err, i) => (
                        <div key={i} className="text-xs bg-destructive/5 text-destructive p-3 rounded-lg border border-destructive/10">
                          <span className="font-mono font-bold block mb-1">{err.externalKey}</span>
                          {err.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
                    <CheckCircle className="w-12 h-12 mb-2" />
                    <p className="font-medium">{t("import.successAll")}</p>
                  </div>
                )}
                
                <div className="flex justify-center pt-4">
                  <Link href="/bottles" className="text-primary hover:underline text-sm font-medium">
                    {t("import.viewCellar")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center border-2 border-dashed border-border/50 rounded-xl">
                <Upload className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-sm">{t("import.empty")}</p>
                <p className="text-xs mt-2 opacity-70">
                  {t("import.required")}<br/>
                  {t("import.optional")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
