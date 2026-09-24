export const KNOWN_LEVELS = ["1AC", "2AC", "3AC", "TC", "1BAC", "2BAC"];
export function normalizeNiveau(value) { const raw = String(value ?? "").trim(); const compact = raw.toUpperCase().replace(/[\s._-]/g, ""); const map = { "1AC": "1AC", "2AC": "2AC", "3AC": "3AC", TC: "TC", "1BAC": "1BAC", "2BAC": "2BAC" }; return { niveau: map[compact] ?? "Other / Unknown", original: raw }; }
