import { fr } from "./fr";

export type TranslationKey = keyof typeof fr;

export function t(key: TranslationKey, vars?: Record<string, string | number>) {
  let value = fr[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([token, replacement]) => {
      value = value.replace(new RegExp(`{${token}}`, "g"), String(replacement));
    });
  }
  return value;
}

const normalizeCode = (code?: string | null) => code?.toLowerCase().trim() ?? "";

const colorLabels: Record<string, string> = {
  red: "Rouge",
  white: "Blanc",
  rose: "Rosé",
  orange: "Orange",
  sparkling: "Effervescent",
  fortified: "Fortifié",
  sweet: "Doux",
  dessert: "Doux",
  other: t("labels.other"),
  unknown: t("labels.unknown"),
};

const typeLabels: Record<string, string> = {
  still: "Tranquille",
  sparkling: "Effervescent",
  fortified: "Fortifié",
  sweet: "Doux",
  dessert: "Doux",
  other: t("labels.other"),
  unknown: t("labels.unknown"),
};

const statusLabels: Record<string, string> = {
  ready: "Prêt",
  ready_before_peak: "Prêt (avant apogée)",
  ready_after_peak: "Après apogée",
  peak: "Apogée",
  drink_soon: "À boire bientôt",
  wait: "Attendre",
  possibly_past: "Peut-être passé",
  to_verify: "À vérifier",
};

const confidenceLabels: Record<string, string> = {
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const windowSourceLabels: Record<string, string> = {
  producer: "Producteur",
  estimate: "Estimation",
  import: "Import",
  cellartracker: "CellarTracker",
  unknown: t("labels.unknown"),
};

const sweetnessLabels: Record<string, string> = {
  dry: "Sec",
  off_dry: "Demi-sec",
  medium: "Moelleux",
  sweet: "Doux",
  dessert: "Doux",
  unknown: t("labels.unknown"),
};

const formatFallback = (code?: string | null) => {
  if (!code) return t("labels.unknown");
  return `${t("labels.other")}: ${code.replace(/_/g, " ")}`;
};

export const mapColorLabel = (code?: string | null) => colorLabels[normalizeCode(code)] || formatFallback(code);
export const mapTypeLabel = (code?: string | null) => typeLabels[normalizeCode(code)] || formatFallback(code);
export const mapStatusLabel = (code?: string | null) => statusLabels[normalizeCode(code)] || formatFallback(code);
export const mapConfidenceLabel = (code?: string | null) => confidenceLabels[normalizeCode(code)] || formatFallback(code);
export const mapWindowSourceLabel = (code?: string | null) => windowSourceLabels[normalizeCode(code)] || formatFallback(code);
export const mapSweetnessLabel = (code?: string | null) => sweetnessLabels[normalizeCode(code)] || formatFallback(code);
