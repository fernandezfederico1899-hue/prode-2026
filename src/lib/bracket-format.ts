/**
 * Formatea slots placeholder de partidos KO en strings legibles para humanos.
 *
 * Mapping de números (openfootball WC 2026):
 *   73-88   → 16avos #1-16
 *   89-96   → Octavos #1-8
 *   97-100  → Cuartos #1-4
 *   101-102 → Semis #1-2
 *   103     → 3er puesto
 *   104     → Final
 */

export function formatSlot(slot: string | null | undefined): string {
  if (!slot) return "A definir";

  // "1A" o "2B" → "1° Grupo A"
  const groupSlot = slot.match(/^([12])([A-L])$/);
  if (groupSlot) {
    return `${groupSlot[1]}° Grupo ${groupSlot[2]}`;
  }

  // "3A/B/C/D/F" → "3° de A/B/C/D/F"
  const thirdSlot = slot.match(/^3([A-L/]+)$/);
  if (thirdSlot) {
    return `3° de ${thirdSlot[1]}`;
  }

  // "W74" o "L101" → "Ganador 16avos #2" / "Perdedor Semi #1"
  const wlSlot = slot.match(/^([WL])(\d+)$/);
  if (wlSlot) {
    const label = wlSlot[1] === "W" ? "Ganador" : "Perdedor";
    const num = parseInt(wlSlot[2], 10);
    return `${label} ${matchNumLabel(num)}`;
  }

  return slot;
}

export function matchNumLabel(num: number): string {
  if (num >= 73 && num <= 88) return `16avos #${num - 72}`;
  if (num >= 89 && num <= 96) return `Octavos #${num - 88}`;
  if (num >= 97 && num <= 100) return `Cuartos #${num - 96}`;
  if (num >= 101 && num <= 102) return `Semi #${num - 100}`;
  if (num === 103) return "3er puesto";
  if (num === 104) return "Final";
  return `Match #${num}`;
}

/**
 * Label corto del partido para el header de la card (ej "16avos #2").
 */
export function matchShortLabel(stage: string, matchNum: number | null): string {
  if (matchNum !== null) return matchNumLabel(matchNum);
  // Fallback por stage si no tiene matchNum
  switch (stage) {
    case "round_of_32":
      return "16avos";
    case "round_of_16":
      return "Octavos";
    case "quarter":
      return "Cuartos";
    case "semi":
      return "Semi";
    case "third_place":
      return "3er puesto";
    case "final":
      return "Final";
    default:
      return "";
  }
}
