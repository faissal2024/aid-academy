import * as XLSX from "xlsx";

const phonePattern = /(?:\+?212[\s().-]*|0)[67](?:[\s().-]*\d){8}/;
const levelPattern = /\b(?:[123]\s*AC|TC|[12]\s*BAC)\b/i;
const aliases = { name: ["name", "nom", "الاسم", "الإسم", "nom complet"], phone: ["phone", "telephone", "téléphone", "tel", "رقم الهاتف", "الهاتف", "mobile"], niveau: ["niveau", "level", "المستوى", "classe", "class"] };
function decodeEntities(value) { return String(value ?? "").replace(/&#x([\da-f]+);|&#(\d+);|&nbsp;/gi, (_, hex, decimal) => hex ? String.fromCodePoint(parseInt(hex, 16)) : decimal ? String.fromCodePoint(parseInt(decimal, 10)) : " ").trim(); }
const clean = (value) => decodeEntities(value).replace(/\s+/g, " ").trim();
const headerKey = (value) => Object.entries(aliases).find(([, names]) => names.includes(clean(value).toLowerCase()))?.[0];

export function parseTextLine(line) {
  const source = decodeEntities(line), phoneMatch = source.match(phonePattern), levelMatch = source.match(levelPattern);
  const phone = phoneMatch?.[0] ?? "", niveau = levelMatch?.[0] ?? "";
  const name = clean(source.replace(phone, "").replace(niveau, "").replace(/[|—–]/g, " ").replace(/\s+-\s+/g, " "));
  if (phone || niveau) return { name, phone: clean(phone), niveau: clean(niveau) };
  const columns = source.split(/\t+|\s{2,}|\s*[|—–]\s*|\s+-\s+/).map(clean).filter(Boolean);
  return { name: columns[0] ?? "", phone: columns[1] ?? "", niveau: columns[2] ?? "" };
}
function detectCells(row) { const cells = row.map(clean), phoneIndex = cells.findIndex((value) => phonePattern.test(value)), levelIndex = cells.findIndex((value) => levelPattern.test(value)); if (phoneIndex >= 0 || levelIndex >= 0) return { name: cells.filter((_, index) => index !== phoneIndex && index !== levelIndex).join(" ").trim(), phone: phoneIndex >= 0 ? cells[phoneIndex] : "", niveau: levelIndex >= 0 ? cells[levelIndex] : "" }; return { name: cells[0] ?? "", phone: cells[1] ?? "", niveau: cells[2] ?? "" }; }
export function parseText(text, sourceFile = "import.txt") { return String(text).split(/\r?\n/).map((line, index) => ({ ...parseTextLine(line), sourceRow: index + 1, sourceFile })).filter((row) => row.name || row.phone || row.niveau); }
export async function parseFile(file) { const ext = file.name.split(".").pop().toLowerCase(); if (ext === "txt") return parseText(await file.text(), file.name); const book = XLSX.read(await file.arrayBuffer(), { type: "array" }), rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1, defval: "" }), keys = rows[0]?.map(headerKey) ?? [], hasHeaders = keys.some(Boolean); return rows.slice(hasHeaders ? 1 : 0).map((row, index) => { const output = detectCells(row); if (hasHeaders) keys.forEach((key, cellIndex) => { if (key) output[key] = clean(row[cellIndex]); }); return { ...output, sourceRow: index + (hasHeaders ? 2 : 1), sourceFile: file.name }; }).filter((row) => row.name || row.phone || row.niveau); }
