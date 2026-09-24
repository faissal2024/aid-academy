const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
export function toLatinDigits(value = "") { return String(value).replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit))); }
export function normalizeMoroccanPhone(value) {
  const original = String(value ?? "").trim(); if (!original) return { valid: false, original, reason: "رقم الهاتف مفقود" };
  let digits = toLatinDigits(original).replace(/[^0-9]/g, ""); if (digits.startsWith("00")) digits = digits.slice(2); if (digits.startsWith("212")) digits = `0${digits.slice(3)}`;
  if (/^0[67]\d{8}$/.test(digits)) return { valid: true, original, phone: `+212${digits.slice(1)}` };
  return { valid: false, original, reason: "رقم مغربي غير صالح أو غير مدعوم" };
}
