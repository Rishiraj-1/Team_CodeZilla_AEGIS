export type DefconLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Assign DEFCON level based on collision probability and miss distance.
 *
 * Reference thresholds (NASA STD-8719.14 / ESA approach):
 *   Pc >= 1e-3 OR miss < 1km   → DEFCON 1 (Emergency — imminent or very high Pc)
 *   Pc >= 1e-4                 → DEFCON 2 (Critical — mandatory avoidance action)
 *   Pc >= 1e-5                 → DEFCON 3 (Elevated — monitoring required)
 *   Pc >= 1e-6                 → DEFCON 4 (Guarded — logged, low concern)
 *   Pc < 1e-6                  → DEFCON 5 (Nominal — no action needed)
 */
export function assignDefcon(Pc: number, missDistanceKm: number): DefconLevel {
  if (Pc >= 1e-3 || missDistanceKm < 1.0) return 1;
  if (Pc >= 1e-4) return 2;
  if (Pc >= 1e-5) return 3;
  if (Pc >= 1e-6) return 4;
  return 5;
}

export const DEFCON_LABELS: Record<DefconLevel, string> = {
  1: 'EMERGENCY',
  2: 'CRITICAL',
  3: 'ELEVATED',
  4: 'GUARDED',
  5: 'NOMINAL',
};

export const DEFCON_COLORS: Record<DefconLevel, string> = {
  1: '#ff3030',
  2: '#ff3030',
  3: '#ff6820',
  4: '#4488ff',
  5: '#2ed87a',
};

/**
 * Compute a risk score (0-100) for an object based on conjunction history.
 * Used to rank objects in the database browser.
 */
export function computeRiskScore(
  conjunctionCount: number,
  maxDefcon: DefconLevel,
  avgMissDistanceKm: number
): number {
  const defconFactor = (6 - maxDefcon) * 15; // 15/30/45/60/75 per DEFCON
  const countFactor = Math.min(25, conjunctionCount * 5);
  const distanceFactor = Math.max(0, 25 - avgMissDistanceKm * 2.5);
  return Math.min(100, Math.round(defconFactor + countFactor + distanceFactor));
}
