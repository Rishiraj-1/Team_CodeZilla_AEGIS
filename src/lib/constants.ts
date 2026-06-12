export const OBJECT_TYPE_STYLES = {
  PAYLOAD: {
    bg:    'rgba(46, 216, 122, 0.10)',
    color: '#2ed87a',
    label: 'PAYLOAD',
  },
  DEBRIS: {
    bg:    'rgba(255, 48, 48, 0.10)',
    color: '#ff3030',
    label: 'DEBRIS',
  },
  ROCKET_BODY: {
    bg:    'rgba(255, 194, 0, 0.10)',
    color: '#ffc200',
    label: 'ROCKET BODY',
  },
  UNKNOWN: {
    bg:    'rgba(90, 80, 64, 0.20)',
    color: '#5a5040',
    label: 'UNKNOWN',
  },
} as const;

export const DEFCON_STYLES = {
  1: { color: '#ff3030', label: 'EMERGENCY',  animate: true  },
  2: { color: '#ff3030', label: 'CRITICAL',   animate: true  },
  3: { color: '#ff6820', label: 'ELEVATED',   animate: false },
  4: { color: '#4488ff', label: 'GUARDED',    animate: false },
  5: { color: '#2ed87a', label: 'NOMINAL',    animate: false },
} as const;

export const AGENT_COLORS = {
  SENTINEL:  '#2ed87a',
  ANALYST:   '#4488ff',
  COMMANDER: '#ffc200',
  HERALD:    '#c084fc',
} as const;
