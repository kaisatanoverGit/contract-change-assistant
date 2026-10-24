// Imports metering_point_changes.csv (English) and data/translations_et.json (Estonian)
// into the KnowledgeItem table. Safe to re-run: existing rows are updated.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const prisma = new PrismaClient();

// Minimal CSV parser with support for quoted fields.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

async function main() {
  const csv = readFileSync(join(root, "metering_point_changes.csv"), "utf8").replace(/^﻿/, "");
  const et = JSON.parse(readFileSync(join(root, "data", "translations_et.json"), "utf8"));
  const [header, ...rows] = parseCsv(csv);
  const col = (name) => header.findIndex((h) => h.trim() === name);

  for (const r of rows) {
    const id = Number(r[col("id")]);
    const en = {
      topic: r[col("topic")].trim(),
      questionEn: r[col("question")].trim(),
      answerEn: r[col("answer")].trim(),
      stepsEn: r[col("steps")].trim(),
    };
    const t = et[String(id)];
    if (!t) console.warn(`No Estonian translation for id ${id}; using English.`);
    const data = {
      ...en,
      questionEt: t?.question ?? en.questionEn,
      answerEt: t?.answer ?? en.answerEn,
      stepsEt: t?.steps ?? en.stepsEn,
    };
    await prisma.knowledgeItem.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log(`Seeded ${rows.length} knowledge items.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
