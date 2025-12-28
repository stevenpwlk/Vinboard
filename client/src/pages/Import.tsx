import { useState } from "react";
import { useImportBottles } from "@/hooks/use-bottles";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Import() {
  const [jsonInput, setJsonInput] = useState("");
  const { mutateAsync: importBottles, isPending } = useImportBottles();
  const { toast } = useToast();
  const [result, setResult] = useState<{ imported: number, updated: number, errors: any[] } | null>(null);

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await importBottles(parsed);
      setResult({
        imported: res.importedCount,
        updated: res.updatedCount,
        errors: res.errors
      });
      toast({
        title: "Import Complete",
        description: `Successfully processed ${res.importedCount + res.updatedCount} bottles.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Import Failed",
        description: err.message || "Invalid JSON format or server error.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-fade">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Import Bottles</h2>
        <p className="text-muted-foreground">Add bottles in bulk via JSON.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> JSON Input
            </h3>
            <textarea
              className="w-full h-96 p-4 font-mono text-xs bg-muted/30 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder={`[\n  {\n    "external_key": "unique_id_1",\n    "producer": "Chateau Margaux",\n    "wine": "Premier Grand Cru Classé",\n    "vintage": "2015",\n    "quantity": 3\n  }\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleImport}
                disabled={isPending || !jsonInput}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isPending ? "Importing..." : "Process Import"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full">
            <h3 className="font-medium mb-4">Results</h3>
            {result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 text-center">
                    <div className="text-2xl font-bold">{result.imported}</div>
                    <div className="text-xs font-medium uppercase tracking-wide opacity-80">New</div>
                  </div>
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-center">
                    <div className="text-2xl font-bold">{result.updated}</div>
                    <div className="text-xs font-medium uppercase tracking-wide opacity-80">Updated</div>
                  </div>
                </div>

                {result.errors.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Errors ({result.errors.length})
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
                    <p className="font-medium">All items processed successfully!</p>
                  </div>
                )}
                
                <div className="flex justify-center pt-4">
                  <Link href="/bottles" className="text-primary hover:underline text-sm font-medium">
                    View Cellar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center border-2 border-dashed border-border/50 rounded-xl">
                <Upload className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-sm">Paste JSON data on the left to begin.</p>
                <p className="text-xs mt-2 opacity-70">
                  Required: external_key<br/>
                  Optional: producer, wine, vintage, etc.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
