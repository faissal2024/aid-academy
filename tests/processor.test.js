import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMoroccanPhone } from "../src/core/normalizer.js";
import { parseText, parseTextLine } from "../src/core/parser.js";
import { processRows } from "../src/core/processor.js";
import { createLevelPdf, getExportableGroups } from "../src/export/exporter.js";

const fullDataset = `0631481350    adam boutoonont    3ac
0617681445    assiah ait benalla    3ac
0625597476    marwane mansoure    3ac
0784071281    hiba azdyoum    3ac
0602561362    zindene elmamoui    3ac

0769896269    mohamade    2ac
0780505214    khadija    2ac
0778911945    hafssa    2ac
0645907668    yassine    2ac
0772597919    hafssa    2ac

0615677881    yassmine obkis    1ac
0783621576    sanaa ait hmadoali    1ac
0684390582    jihan idouakkas    1ac
0780505214    khadija    2ac
0618832892    drissi meryam    1ac`;

test("normalizes local, international, and formatted Moroccan phones identically", () => {
  const expected = "+212631481350";
  ["0631481350", "+212631481350", "212631481350", "06 31 48 13 50", "06-31-48-13-50"].forEach((value) => {
    const result = normalizeMoroccanPhone(value); assert.equal(result.valid, true); assert.equal(result.phone, expected);
  });
});
test("parses whitespace-delimited TXT rows and decodes entities", () => assert.deepEqual(parseTextLine("0631481350    adam boutoonont    3ac&#x20;"), { phone: "0631481350", name: "adam boutoonont", niveau: "3ac" }));
test("last duplicate phone occurrence replaces the entire record", () => { const result = processRows(parseText("0631481350    Adam    3AC\n0631481350    Yassine    2AC")); assert.equal(result.contacts.length, 1); assert.equal(result.contacts[0].name, "Yassine"); assert.equal(result.contacts[0].niveau, "2AC"); assert.equal(result.duplicates.length, 1); });
test("same name with different phones remains separate", () => assert.equal(processRows(parseText("0778911945    Hafssa    2AC\n0772597919    Hafssa    2AC")).contacts.length, 2));
test("the required 15-record fixture yields 14 valid unique contacts", () => { const result = processRows(parseText(fullDataset, "academy-fixture.txt")); assert.equal(result.total, 15); assert.equal(result.invalid.length, 0); assert.equal(result.duplicates.length, 1); assert.equal(result.contacts.length, 14); assert.equal(result.groups["1AC"].length, 4); assert.equal(result.groups["2AC"].length, 5); assert.equal(result.groups["3AC"].length, 5); const retained = result.contacts.find((contact) => contact.phone === "+212780505214"); assert.equal(retained.name, "khadija"); assert.equal(retained.niveau, "2AC"); });
test("export helpers retain only non-empty final niveau groups", () => { const result = processRows(parseText(fullDataset)); const groups = getExportableGroups({ ...result.groups, TC: [], "2BAC": [] }); assert.deepEqual(Object.keys(groups).sort(), ["1AC", "2AC", "3AC"]); assert.equal(groups["2AC"].every((contact) => contact.niveau === "2AC"), true); assert.equal(groups["2AC"].some((contact) => contact.phone === "+212780505214"), true); assert.equal(typeof createLevelPdf, "function"); });
