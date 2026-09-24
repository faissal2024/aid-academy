import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const ACADEMY_NAME = "الأكاديمية الخاصة للذكاء الاصطناعي وتطور";
const exportRows = (contacts) => contacts.map(({ name, phone, niveau }) => ({ Name: name, Phone: phone, Niveau: niveau }));
const safeName = (level) => level.replaceAll(" / ", "-");
const download = (blob, filename) => { const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
const csvText = (contacts) => `\ufeff${XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportRows(contacts)))}`;

export function createWorkbook(contacts) { const sheet = XLSX.utils.json_to_sheet(exportRows(contacts)); sheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }]; const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Contacts"); return workbook; }
export function getExportableGroups(groups) { return Object.fromEntries(Object.entries(groups).filter(([, contacts]) => contacts.length)); }
export function exportExcel(contacts, filename = "academy-contacts.xlsx") { download(new Blob([XLSX.write(createWorkbook(contacts), { bookType: "xlsx", type: "array" })]), filename); }
export function exportCsv(contacts, filename = "academy-contacts.csv") { download(new Blob([csvText(contacts)], { type: "text/csv;charset=utf-8" }), filename); }
export function exportLevelExcel(level, contacts) { exportExcel(contacts, `${safeName(level)}.xlsx`); }
export function exportLevelCsv(level, contacts) { exportCsv(contacts, `${safeName(level)}.csv`); }
export async function exportZip(groups) { const zip = new JSZip(); Object.entries(getExportableGroups(groups)).forEach(([level, contacts]) => zip.file(`${safeName(level)}.xlsx`, XLSX.write(createWorkbook(contacts), { bookType: "xlsx", type: "array" }))); download(await zip.generateAsync({ type: "blob" }), "academy-contacts-by-level.zip"); }

function textImage(text, width, height, options = {}) { const scale = 4, canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.ceil(width * scale)); canvas.height = Math.max(1, Math.ceil(height * scale)); const context = canvas.getContext("2d"); context.scale(scale, scale); context.fillStyle = options.color ?? "#172638"; context.font = `${options.weight ?? "400"} ${options.size ?? 9}px Arial, Tahoma, sans-serif`; context.textBaseline = "middle"; context.direction = options.rtl ? "rtl" : "ltr"; context.textAlign = options.rtl ? "right" : "left"; context.fillText(String(text), options.rtl ? width - 1 : 1, height / 2, width - 2); return canvas.toDataURL("image/png"); }
async function logoData() { try { const response = await fetch("/assets/academy-logo.png"); if (!response.ok) return null; const blob = await response.blob(), bytes = new Uint8Array(await blob.arrayBuffer()), type = bytes[0] === 0xff && bytes[1] === 0xd8 ? "JPEG" : "PNG"; return await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ data: reader.result, type }); reader.onerror = () => resolve(null); reader.readAsDataURL(blob); }); } catch { return null; } }

export async function createLevelPdf(level, contacts) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" }), pageWidth = doc.internal.pageSize.getWidth(), logo = await logoData();
  if (logo) doc.addImage(logo.data, logo.type, 14, 10, 22, 22);
  doc.addImage(textImage(ACADEMY_NAME, 128, 8, { rtl: true, size: 12, weight: "700" }), "PNG", pageWidth - 144, 11, 128, 8);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(`Niveau: ${level}`, 14, 39); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(`Nombre de contacts: ${contacts.length}`, 14, 46); doc.text(`Date d'export: ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`, 14, 51);
  // Native AutoTable line breaking determines the exact row height before draw.
  autoTable(doc, { startY: 57, head: [["#", "Name", "Phone", "Niveau"]], body: contacts.map((contact, index) => [String(index + 1), contact.name, contact.phone, contact.niveau]), theme: "grid", showHead: "everyPage", rowPageBreak: "avoid", styles: { font: "helvetica", fontSize: 9, cellPadding: 3, valign: "middle", overflow: "linebreak", textColor: [23, 38, 56], lineColor: [218, 228, 234], lineWidth: .1, minCellHeight: 9 }, headStyles: { fillColor: [12, 49, 77], textColor: 255, fontStyle: "bold" }, columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: 72, overflow: "linebreak" }, 2: { cellWidth: 55, halign: "left", overflow: "linebreak" }, 3: { cellWidth: 30, halign: "center" } } });
  const pages = doc.getNumberOfPages(); for (let page = 1; page <= pages; page += 1) { doc.setPage(page); doc.setDrawColor(218, 228, 234); doc.line(14, 287, pageWidth - 14, 287); doc.setFontSize(8); doc.setTextColor(90, 108, 126); doc.text(`Page ${page} / ${pages}`, pageWidth - 14, 292, { align: "right" }); }
  return doc;
}
export async function exportLevelPdf(level, contacts) { const doc = await createLevelPdf(level, contacts); doc.save(`${safeName(level)}.pdf`); }
export async function exportAllLevels(groups) { const zip = new JSZip(), nonEmptyGroups = getExportableGroups(groups); for (const [level, contacts] of Object.entries(nonEmptyGroups)) { const filename = safeName(level); zip.file(`${filename}.xlsx`, XLSX.write(createWorkbook(contacts), { bookType: "xlsx", type: "array" })); zip.file(`${filename}.csv`, csvText(contacts)); zip.file(`${filename}.pdf`, (await createLevelPdf(level, contacts)).output("arraybuffer")); } download(await zip.generateAsync({ type: "blob" }), "academy-exports.zip"); }
