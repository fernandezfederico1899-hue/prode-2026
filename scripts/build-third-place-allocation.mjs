// Genera src/data/third-place-allocation.json a partir de la tabla oficial de la
// FIFA (495 combinaciones) publicada en Wikipedia como wikitext estático.
//
// La tabla "Combinations of matches in the round of 32" mapea, para cada
// combinación de cuáles 8 grupos (de los 12) clasifican un mejor-tercero, a qué
// partido de 16avos va el tercero de cada grupo.
//
// Salida: { "<8 letras de grupo ordenadas>": { "<matchNum>": "<grupo del tercero>" } }
// p.ej. "BDEFIJKL": { "79": "E", "85": "J", "81": "B", "74": "D", ... }
//
// Uso: node scripts/build-third-place-allocation.mjs
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PAGE = "Template:2026 FIFA World Cup third-place table";
const API = "https://en.wikipedia.org/w/api.php";

// Orden de las 8 columnas de asignación en la tabla (header "1A vs", "1B vs", ...)
// y el match de 16avos al que corresponde cada una (ver src/data/wc2026.json).
const COLUMN_ORDER = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"];
const COLUMN_TO_MATCH = { "1A": 79, "1B": 85, "1D": 81, "1E": 74, "1G": 82, "1I": 77, "1K": 87, "1L": 80 };

// Grupos elegibles por slot (del slot "3X/Y/Z/W/V" de cada match en wc2026.json).
// Se usa para validar que el parseo respeta las restricciones oficiales.
const ELIGIBLE = {
  74: ["A", "B", "C", "D", "F"],
  77: ["C", "D", "F", "G", "H"],
  79: ["C", "E", "F", "H", "I"],
  80: ["E", "H", "I", "J", "K"],
  81: ["B", "E", "F", "I", "J"],
  82: ["A", "E", "H", "I", "J"],
  85: ["E", "F", "G", "I", "J"],
  87: ["D", "E", "I", "J", "L"],
};

async function fetchWikitext() {
  const url = `${API}?action=parse&page=${encodeURIComponent(PAGE)}&prop=wikitext&format=json&formatversion=2`;
  const res = await fetch(url, { headers: { "User-Agent": "prode-2026/1.0 (personal pool app)" } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const json = await res.json();
  const wt = json?.parse?.wikitext;
  if (!wt) throw new Error("sin wikitext en la respuesta");
  return wt;
}

function parseRows(wikitext) {
  // La tabla relevante arranca en "Combinations of matches in the round of 32".
  const start = wikitext.indexOf("Combinations of matches in the round of 32");
  if (start === -1) throw new Error("no se encontró la tabla de combinaciones");
  const table = wikitext.slice(start);

  // Cada fila de datos arranca con un "|-" y contiene un `! scope="row" | NN`.
  const blocks = table.split(/\n\|-/);
  const rows = [];
  for (const block of blocks) {
    const noMatch = block.match(/scope="row"\s*\|\s*(\d+)/);
    if (!noMatch) continue; // header u otra cosa
    const no = Number(noMatch[1]);

    // Grupos que clasifican: letras A-L en negrita (solo aparecen en la sección de grupos).
    const groups = [...block.matchAll(/'''([A-L])'''/g)].map((m) => m[1]);

    // Asignaciones: tokens 3X (X = A-L), en orden de columna. Son exactamente 8.
    const assigns = [...block.matchAll(/\b3([A-L])\b/g)].map((m) => m[1]);

    rows.push({ no, groups, assigns });
  }
  return rows;
}

// Las 8 combinaciones "still possible" se listan dos veces (resaltadas arriba +
// en su posición ordenada). Deduplicamos por No., exigiendo que las repetidas
// sean idénticas (misma combinación y misma asignación).
function dedupeRows(rows) {
  const byNo = new Map();
  for (const row of rows) {
    const prev = byNo.get(row.no);
    if (!prev) {
      byNo.set(row.no, row);
      continue;
    }
    const same =
      prev.groups.join("") === row.groups.join("") &&
      prev.assigns.join("") === row.assigns.join("");
    if (!same) {
      throw new Error(
        `combinación No.${row.no} aparece repetida con datos distintos: ` +
          `${prev.groups.join("")}/${prev.assigns.join("")} vs ${row.groups.join("")}/${row.assigns.join("")}`,
      );
    }
  }
  return [...byNo.values()];
}

function validateRow({ no, groups, assigns }) {
  const errs = [];
  if (groups.length !== 8) errs.push(`fila ${no}: ${groups.length} grupos (esperaba 8)`);
  if (assigns.length !== 8) errs.push(`fila ${no}: ${assigns.length} asignaciones (esperaba 8)`);
  if (errs.length) return errs;

  const groupSet = new Set(groups);
  if (groupSet.size !== 8) errs.push(`fila ${no}: grupos duplicados`);

  const assignSet = new Set(assigns);
  if (assignSet.size !== 8) errs.push(`fila ${no}: asignaciones duplicadas`);

  // Las 8 asignaciones deben ser exactamente el conjunto de 8 grupos clasificados (permutación).
  for (const g of assigns) {
    if (!groupSet.has(g)) errs.push(`fila ${no}: asigna tercero de grupo ${g} que no clasificó`);
  }

  // Cada asignación debe respetar la lista de elegibles del slot.
  COLUMN_ORDER.forEach((col, i) => {
    const matchNum = COLUMN_TO_MATCH[col];
    const g = assigns[i];
    if (g && !ELIGIBLE[matchNum].includes(g)) {
      errs.push(`fila ${no}: match ${matchNum} (${col}) recibe 3${g}, fuera de [${ELIGIBLE[matchNum]}]`);
    }
  });
  return errs;
}

function buildAllocation(rows) {
  const out = {};
  for (const row of rows) {
    const key = [...row.groups].sort().join("");
    const mapping = {};
    COLUMN_ORDER.forEach((col, i) => {
      mapping[COLUMN_TO_MATCH[col]] = row.assigns[i];
    });
    if (out[key]) throw new Error(`combinación duplicada: ${key} (filas ${out[key].__no} y ${row.no})`);
    out[key] = mapping;
  }
  return out;
}

async function main() {
  const wikitext = await fetchWikitext();
  const rawRows = parseRows(wikitext);
  const rows = dedupeRows(rawRows);
  console.log(`Filas parseadas: ${rawRows.length} (${rows.length} únicas tras dedup)`);

  const allErrors = rows.flatMap(validateRow);
  if (allErrors.length) {
    console.error(`\n❌ ${allErrors.length} errores de validación:`);
    for (const e of allErrors.slice(0, 30)) console.error("  -", e);
    process.exit(1);
  }

  if (rows.length !== 495) {
    console.error(`\n❌ esperaba 495 combinaciones, parseé ${rows.length}`);
    process.exit(1);
  }

  const allocation = buildAllocation(rows);
  if (Object.keys(allocation).length !== 495) {
    console.error(`\n❌ ${Object.keys(allocation).length} claves únicas (esperaba 495)`);
    process.exit(1);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = join(here, "..", "src", "data", "third-place-allocation.json");
  await writeFile(outPath, JSON.stringify(allocation, null, 0) + "\n", "utf8");
  console.log(`✅ ${Object.keys(allocation).length} combinaciones válidas → ${outPath}`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
