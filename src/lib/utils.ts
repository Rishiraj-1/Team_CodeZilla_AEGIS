import { DefconLevel } from '@/types';

/**
 * Format a number with commas: 28441 → "28,441"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format Pc in scientific notation: 0.00032 → "3.2 × 10⁻⁴"
 */
export function formatPc(pc: number): string {
  if (pc === 0) return '0';
  const exp = Math.floor(Math.log10(pc));
  const mantissa = pc / Math.pow(10, exp);
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻',
  };
  const supExp = String(exp).split('').map(c => superscripts[c] || c).join('');
  return `${mantissa.toFixed(1)} × 10${supExp}`;
}

/**
 * Get remaining time as HH:MM:SS from an ISO date string
 */
export function getCountdown(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Get DEFCON CSS class suffix
 */
export function defconClass(level: DefconLevel): string {
  return `d${level}`;
}

/**
 * Get UTC time formatted as HH:MM:SS UTC
 */
export function utcNow(): string {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
}

/**
 * Color for object type on the globe
 */
export function objectTypeColor(type: string): string {
  switch (type) {
    case 'DEBRIS': return '#ff3030';
    case 'PAYLOAD': return '#2ed87a';
    case 'ROCKET_BODY': return '#ffc200';
    default: return '#7a6a3a';
  }
}

/**
 * DEFCON color
 */
export function defconColor(level: DefconLevel): string {
  switch (level) {
    case 1:
    case 2: return 'var(--red)';
    case 3: return 'var(--orange)';
    case 4: return 'var(--blue)';
    case 5: return 'var(--green)';
  }
}

/**
 * DEFCON raw hex color (for inline styles where CSS vars won't work)
 */
export function defconHex(level: DefconLevel): string {
  switch (level) {
    case 1:
    case 2: return '#ff3030';
    case 3: return '#ff6820';
    case 4: return '#4488ff';
    case 5: return '#2ed87a';
  }
}

/**
 * Agent color
 */
export function agentColor(agent: string): string {
  switch (agent) {
    case 'SENTINEL': return 'var(--sentinel)';
    case 'ANALYST': return 'var(--analyst)';
    case 'COMMANDER': return 'var(--commander)';
    case 'HERALD': return 'var(--herald)';
    default: return 'var(--t2)';
  }
}

export function agentHex(agent: string): string {
  switch (agent) {
    case 'SENTINEL': return '#2ed87a';
    case 'ANALYST': return '#4488ff';
    case 'COMMANDER': return '#ffc200';
    case 'HERALD': return '#c084fc';
    default: return '#5a5040';
  }
}

