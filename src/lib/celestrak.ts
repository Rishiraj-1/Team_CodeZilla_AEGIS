// CelesTrak provides free TLE data for all tracked space objects.
// We fetch multiple catalogs to get diverse data covering key scenarios.

export interface ParsedTLE {
  noradId: string;
  name: string;
  tleLine1: string;
  tleLine2: string;
  objectType: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY' | 'UNKNOWN';
  country: string;
}

// CelesTrak GP data API — returns JSON with orbital elements
const CELESTRAK_BASE = 'https://celestrak.org';

// Groups to fetch — focused on LEO where most conjunctions happen
export const TLE_GROUPS = [
  {
    url: `${CELESTRAK_BASE}/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle`,
    type: 'PAYLOAD' as const,
    label: 'Space Stations'
  },
  {
    url: `${CELESTRAK_BASE}/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`,
    type: 'PAYLOAD' as const,
    label: 'Starlink'
  },
  {
    url: `${CELESTRAK_BASE}/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`,
    type: 'PAYLOAD' as const,
    label: 'Active Satellites'
  },
  {
    url: `${CELESTRAK_BASE}/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle`,
    type: 'DEBRIS' as const,
    label: 'Iridium 33 Debris'
  },
  {
    url: `${CELESTRAK_BASE}/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=tle`,
    type: 'DEBRIS' as const,
    label: 'Cosmos 2251 Debris'
  },
  {
    url: `${CELESTRAK_BASE}/NORAD/elements/gp.php?GROUP=fengyun-1c-debris&FORMAT=tle`,
    type: 'DEBRIS' as const,
    label: 'FY-1C Debris (2007 ASAT)'
  },
];

// CelesTrak JSON format — GP element set
interface CelesTrakGP {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: string;
  OBJECT_TYPE: string;
  CLASSIFICATION_TYPE: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  SEMIMAJOR_AXIS: number;
  PERIOD: number;
  APOAPSIS: number;
  PERIAPSIS: number;
  SITE: string;
  RCSSIZE: string;
  LAUNCH_DATE: string;
  DECAY_DATE: string | null;
  COUNTRY_CODE: string;
}

export function parseCelesTrakGP(gp: CelesTrakGP, defaultType: ParsedTLE['objectType']): ParsedTLE {
  // Determine object type from CelesTrak's own field
  let objectType: ParsedTLE['objectType'] = defaultType;
  if (gp.OBJECT_TYPE === 'DEBRIS') objectType = 'DEBRIS';
  else if (gp.OBJECT_TYPE === 'ROCKET BODY' || gp.OBJECT_TYPE === 'ROCKET_BODY') objectType = 'ROCKET_BODY';
  else if (gp.OBJECT_TYPE === 'PAYLOAD') objectType = 'PAYLOAD';

  return {
    noradId: String(gp.NORAD_CAT_ID || ''),
    name: (gp.OBJECT_NAME || '').trim() || 'UNKNOWN',
    tleLine1: gp.TLE_LINE1 || '',
    tleLine2: gp.TLE_LINE2 || '',
    objectType,
    country: gp.COUNTRY_CODE || 'UNKNOWN',
  };
}

export function parseRawTLEText(text: string, defaultType: ParsedTLE['objectType']): ParsedTLE[] {
  const lines = text.split(/\r?\n/);
  const parsed: ParsedTLE[] = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const nameLine = lines[i]?.trim();
    const line1 = lines[i + 1]?.trim();
    const line2 = lines[i + 2]?.trim();

    if (!nameLine || !line1 || !line2) continue;

    // A valid TLE line 1 starts with '1 ' and line 2 starts with '2 '
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      // Realign loop increment in case there is a blank line or formatting shift
      i -= 2;
      continue;
    }

    const noradId = line1.substring(2, 7).trim();

    parsed.push({
      noradId,
      name: nameLine,
      tleLine1: line1,
      tleLine2: line2,
      objectType: defaultType,
      country: 'UNKNOWN',
    });
  }

  return parsed;
}

export async function fetchTLEGroup(url: string, defaultType: ParsedTLE['objectType']): Promise<ParsedTLE[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 7200 } // Cache for 2 hours
    });

    if (!res.ok) {
      console.error(`CelesTrak TLE fetch failed: ${url} → ${res.status}`);
      return [];
    }

    const text = await res.text();
    return parseRawTLEText(text, defaultType);
  } catch (error) {
    console.error(`CelesTrak TLE fetch error: ${url}`, error);
    return [];
  }
}

export async function fetchAllTLEData(): Promise<ParsedTLE[]> {
  const allObjects: ParsedTLE[] = [];
  const seen = new Set<string>();

  for (const group of TLE_GROUPS) {
    const groupObjects = await fetchTLEGroup(group.url, group.type);
    
    let added = 0;
    for (const obj of groupObjects) {
      if (!seen.has(obj.noradId)) {
        seen.add(obj.noradId);
        allObjects.push(obj);
        added++;
      }
    }
    
    console.log(`Ingested group: ${group.label} (${groupObjects.length} parsed, ${added} new unique objects)`);
    
    // 500ms delay to prevent CelesTrak rate-limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allObjects;
}
