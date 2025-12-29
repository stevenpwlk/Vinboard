export function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function normalizeToken(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  return stripDiacritics(str).toLowerCase();
}

export function normalizeColor(value: unknown): string | null {
  const token = normalizeToken(value);
  if (!token) return null;
  const map: Record<string, string> = {
    rose: "rose",
    rouge: "red",
    red: "red",
    blanc: "white",
    white: "white",
    orange: "orange",
    sparkling: "sparkling",
    effervescent: "sparkling",
    petillant: "sparkling",
    fortified: "fortified",
    fortifie: "fortified",
  };

  return map[token] ?? token;
}

export function normalizeType(value: unknown): string | null {
  const token = normalizeToken(value);
  if (!token) return null;
  const map: Record<string, string> = {
    still: "still",
    tranquille: "still",
    sparkling: "sparkling",
    effervescent: "sparkling",
    petillant: "sparkling",
    fortified: "fortified",
    fortifie: "fortified",
  };

  return map[token] ?? token;
}

export function normalizeConfidence(value: unknown): string | null {
  return normalizeToken(value);
}

export function normalizeWindowSource(value: unknown): string | null {
  return normalizeToken(value);
}

export function normalizeSweetness(value: unknown): string | null {
  return normalizeToken(value);
}

export function normalizeLocation(value: unknown): string | null {
  return normalizeToken(value);
}
