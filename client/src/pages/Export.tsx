import { useState } from "react";
import { Download } from "lucide-react";
import { t } from "@/i18n";
import { useToast } from "@/hooks/use-toast";

type ExportType = "json" | "csv" | "bottles";

const exportConfig: Record<ExportType, { endpoint: string; fallbackFilename: string }> = {
  json: {
    endpoint: "/api/export.json",
    fallbackFilename: "vinboard_export.json",
  },
  csv: {
    endpoint: "/api/export.csv",
    fallbackFilename: "vinboard_export.csv",
  },
  bottles: {
    endpoint: "/api/export.bottles.json",
    fallbackFilename: "vinboard_export_bottles.json",
  },
};

export default function Export() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<ExportType | null>(null);

  const extractFilename = (contentDisposition: string | null, fallback: string) => {
    if (!contentDisposition) {
      return fallback;
    }
    const match = /filename="([^"]+)"/.exec(contentDisposition);
    return match?.[1] ?? fallback;
  };

  const handleDownload = async (type: ExportType) => {
    const config = exportConfig[type];
    setDownloading(type);
    try {
      const response = await fetch(config.endpoint);
      if (!response.ok) {
        throw new Error(t("export.error"));
      }
      const blob = await response.blob();
      const filename = extractFilename(
        response.headers.get("content-disposition"),
        config.fallbackFilename
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: t("export.errorTitle"),
        description: t("export.error"),
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in-fade">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">{t("export.title")}</h2>
        <p className="text-muted-foreground">{t("export.subtitle")}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("export.description")}</p>
          <p className="text-xs text-muted-foreground">{t("export.todo")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleDownload("json")}
            disabled={downloading !== null}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === "json" ? t("export.downloading") : t("export.downloadJson")}
          </button>
          <button
            onClick={() => handleDownload("csv")}
            disabled={downloading !== null}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-muted text-foreground font-semibold rounded-xl border border-border hover:bg-muted/70 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === "csv" ? t("export.downloading") : t("export.downloadCsv")}
          </button>
        </div>

        <div>
          <button
            onClick={() => handleDownload("bottles")}
            disabled={downloading !== null}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3 h-3" />
            {downloading === "bottles" ? t("export.downloading") : t("export.downloadBottlesJson")}
          </button>
        </div>
      </div>
    </div>
  );
}
