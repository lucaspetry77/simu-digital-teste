// Baixa os dados públicos usados pelo SIMU (questões, TRI, percentis, SISU…)
// para data/raw/. Depois rode `npm run data:build` para gerar os pacotes leves
// em public/data/.
//
// Fonte padrão: o próprio simu.digital. Para usar outra origem:
//   SIMU_DATA_URL=https://exemplo.com/data npm run data:sync
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.SIMU_DATA_URL ?? "https://www.simu.digital/data").replace(/\/$/, "");
const FILES = [
  "questions.json",
  "solutions.json",
  "tri.json",
  "percentiles.json",
  "sisu.json",
  "coverage.json",
  "editorial-notes.json",
];
const OUT = path.join(process.cwd(), "data", "raw");

await mkdir(OUT, { recursive: true });

for (const file of FILES) {
  const url = `${BASE}/${file}`;
  process.stdout.write(`↓ ${url} … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
  const text = await res.text();
  JSON.parse(text); // garante que é JSON válido antes de gravar
  await writeFile(path.join(OUT, file), text);
  console.log(`${(text.length / 1024 / 1024).toFixed(2)} MB`);
}
console.log("Pronto. Agora rode: npm run data:build");
