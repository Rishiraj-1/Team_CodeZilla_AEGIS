import {
  SpaceObject,
  Conjunction,
  DefconLevel,
  TickerItem,
  DebrisGrowthPoint,
  OrbitalShell,
  CountryBreakdown,
  ChatMessage,
} from '@/types';

// ─── Space Objects ────────────────────────────────────────────────────────

const now = Date.now();
function hoursFromNow(h: number): string {
  return new Date(now + h * 3600000).toISOString();
}

export const SPACE_OBJECTS: SpaceObject[] = [
  {
    id: 'obj-001', name: 'COSMOS-1500', noradId: 41788, type: 'PAYLOAD',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 662,
    inclination: 82.5, period: 97.8, launched: '1983-09-28',
    riskScore: 72, status: 'INACTIVE', lat: 42.3, lng: 73.1,
    tle1: '1 41788U 83094A   26161.54321098  .00000023  00000-0  16234-4 0  9991',
    tle2: '2 41788  82.5201 234.1122 0012345 123.4567 236.7890 14.34567890123456',
  },
  {
    id: 'obj-002', name: 'STARLINK-2847', noradId: 48274, type: 'PAYLOAD',
    country: 'USA', countryFull: 'USA (SpaceX)', altitude: 555,
    inclination: 53.0, period: 95.7, launched: '2021-05-04',
    riskScore: 18, status: 'ACTIVE', lat: 31.2, lng: -97.4,
    tle1: '1 48274U 21032A   26161.12345678  .00001234  00000-0  12345-3 0  9998',
    tle2: '2 48274  53.0544 112.4455 0001234 234.5678 125.4321 15.12345678 12345',
  },
  {
    id: 'obj-003', name: 'FENGYUN-1C DEB', noradId: 29479, type: 'DEBRIS',
    country: 'PRC', countryFull: 'PRC (China)', altitude: 845,
    inclination: 99.1, period: 101.3, launched: '1999-05-10',
    riskScore: 91, status: 'INACTIVE', lat: -12.5, lng: 104.8,
    tle1: '1 29479U 99025DEB 26161.98765432  .00000034  00000-0  23456-4 0  9993',
    tle2: '2 29479  99.1234 145.6789 0034567 234.5678 125.4321 14.23456789 23456',
  },
  {
    id: 'obj-004', name: 'SL-16 R/B', noradId: 22285, type: 'ROCKET_BODY',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 830,
    inclination: 71.0, period: 101.0, launched: '1992-11-17',
    riskScore: 85, status: 'INACTIVE', lat: 56.8, lng: 37.6,
    tle1: '1 22285U 92093B   26161.11111111  .00000012  00000-0  34567-4 0  9994',
    tle2: '2 22285  71.0123 289.0123 0056789 123.4567 236.7890 14.12345678 34567',
  },
  {
    id: 'obj-005', name: 'IRIDIUM 33 DEB', noradId: 33776, type: 'DEBRIS',
    country: 'USA', countryFull: 'USA', altitude: 780,
    inclination: 86.4, period: 100.4, launched: '1997-09-14',
    riskScore: 88, status: 'INACTIVE', lat: -45.2, lng: -23.1,
    tle1: '1 33776U 97051DEB 26161.22222222  .00000045  00000-0  45678-4 0  9995',
    tle2: '2 33776  86.4321 123.4567 0012345 345.6789  14.2345 14.34567890 45678',
  },
  {
    id: 'obj-006', name: 'COSMOS-2251 DEB', noradId: 34128, type: 'DEBRIS',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 790,
    inclination: 74.0, period: 100.7, launched: '1993-06-16',
    riskScore: 82, status: 'INACTIVE', lat: 62.1, lng: -45.3,
    tle1: '1 34128U 93036DEB 26161.33333333  .00000056  00000-0  56789-4 0  9996',
    tle2: '2 34128  74.0234 234.5678 0023456 123.4567 236.7890 14.23456789 56789',
  },
  {
    id: 'obj-007', name: 'STARLINK-1007', noradId: 44735, type: 'PAYLOAD',
    country: 'USA', countryFull: 'USA (SpaceX)', altitude: 550,
    inclination: 53.0, period: 95.6, launched: '2019-11-11',
    riskScore: 12, status: 'ACTIVE', lat: -8.5, lng: 142.7,
    tle1: '1 44735U 19074A   26161.44444444  .00002345  00000-0  23456-3 0  9997',
    tle2: '2 44735  53.0123  89.0123 0001234 123.4567 236.7890 15.23456789 67890',
  },
  {
    id: 'obj-008', name: 'ENVISAT', noradId: 27386, type: 'PAYLOAD',
    country: 'ESA', countryFull: 'ESA (Europe)', altitude: 770,
    inclination: 98.5, period: 100.3, launched: '2002-03-01',
    riskScore: 68, status: 'INACTIVE', lat: 22.8, lng: -115.2,
    tle1: '1 27386U 02009A   26161.55555555  .00000067  00000-0  67890-4 0  9998',
    tle2: '2 27386  98.5432 345.6789 0001234 234.5678 125.4321 14.34567890 78901',
  },
  {
    id: 'obj-009', name: 'COSMOS-954', noradId: 10951, type: 'PAYLOAD',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 258,
    inclination: 65.0, period: 89.6, launched: '1977-09-18',
    riskScore: 45, status: 'INACTIVE', lat: 55.4, lng: 88.2,
  },
  {
    id: 'obj-010', name: 'DELTA 2 R/B', noradId: 25154, type: 'ROCKET_BODY',
    country: 'USA', countryFull: 'USA', altitude: 910,
    inclination: 99.0, period: 103.2, launched: '1998-02-14',
    riskScore: 56, status: 'INACTIVE', lat: -34.6, lng: 18.4,
  },
  {
    id: 'obj-011', name: 'GLOBALSTAR M069', noradId: 27978, type: 'PAYLOAD',
    country: 'USA', countryFull: 'USA', altitude: 1414,
    inclination: 52.0, period: 113.7, launched: '2003-12-20',
    riskScore: 22, status: 'ACTIVE', lat: 15.2, lng: -66.3,
  },
  {
    id: 'obj-012', name: 'CZ-6A DEB', noradId: 55012, type: 'DEBRIS',
    country: 'PRC', countryFull: 'PRC (China)', altitude: 702,
    inclination: 97.5, period: 98.8, launched: '2023-03-15',
    riskScore: 78, status: 'INACTIVE', lat: -62.3, lng: 78.9,
  },
  {
    id: 'obj-013', name: 'BREEZE-M DEB', noradId: 38746, type: 'DEBRIS',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 495,
    inclination: 49.4, period: 94.2, launched: '2012-08-06',
    riskScore: 64, status: 'INACTIVE', lat: 28.7, lng: 52.1,
  },
  {
    id: 'obj-014', name: 'MICROSAT-R DEB', noradId: 44122, type: 'DEBRIS',
    country: 'IND', countryFull: 'India (ISRO)', altitude: 310,
    inclination: 96.6, period: 90.8, launched: '2019-01-24',
    riskScore: 71, status: 'INACTIVE', lat: -5.8, lng: -172.4,
  },
  {
    id: 'obj-015', name: 'ONEWEB-0237', noradId: 48834, type: 'PAYLOAD',
    country: 'GBR', countryFull: 'UK (OneWeb)', altitude: 1200,
    inclination: 87.9, period: 109.5, launched: '2021-08-21',
    riskScore: 9, status: 'ACTIVE', lat: 72.1, lng: -8.5,
  },
  {
    id: 'obj-016', name: 'SL-8 R/B', noradId: 13309, type: 'ROCKET_BODY',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 975,
    inclination: 82.9, period: 104.6, launched: '1982-06-01',
    riskScore: 79, status: 'INACTIVE', lat: -78.2, lng: 33.7,
  },
  {
    id: 'obj-017', name: 'ATLAS 5 CENTAUR R/B', noradId: 40258, type: 'ROCKET_BODY',
    country: 'USA', countryFull: 'USA', altitude: 620,
    inclination: 28.5, period: 96.8, launched: '2014-10-29',
    riskScore: 42, status: 'INACTIVE', lat: 18.5, lng: -75.2,
  },
  {
    id: 'obj-018', name: 'METEOR 2-5 DEB', noradId: 16105, type: 'DEBRIS',
    country: 'CIS', countryFull: 'CIS (Russia)', altitude: 940,
    inclination: 81.2, period: 103.8, launched: '1985-10-03',
    riskScore: 53, status: 'INACTIVE', lat: 48.3, lng: 126.8,
  },
];

// ─── Conjunctions ─────────────────────────────────────────────────────────

export const CONJUNCTIONS: Conjunction[] = [
  {
    id: 'conj-001',
    primary: SPACE_OBJECTS[0],   // COSMOS-1500
    secondary: SPACE_OBJECTS[1], // STARLINK-2847
    tca: hoursFromNow(2.25),
    missDistance: 1.8,
    collisionPc: 3.2e-4,
    relVelocity: 14.3,
    defcon: 2,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-0.5),
        text: 'Orbital scan detected anomalous convergence. SGP4 propagation at T+2h17m yields minimum range of 1.8km, well within the 5km conjunction threshold. Relative velocity of 14.3 km/s confirms hypervelocity threat classification.',
      },
      {
        agent: 'ANALYST', timestamp: hoursFromNow(-0.4),
        text: 'Pc = 3.2×10⁻⁴ — exceeds NASA STD-8719.14 mandatory action threshold (1×10⁻⁴) by factor of 3.2. DEFCON 2 assigned. Covariance realism assessed as nominal. No recent maneuver history for primary.',
      },
      {
        agent: 'COMMANDER', timestamp: hoursFromNow(-0.3),
        text: 'STARLINK-2847 is maneuverable. Recommended retrograde burn of Δv = 0.12 m/s at T−45min achieves post-maneuver miss distance of 8.4 km. Fuel cost: 0.08 kg Xe. GO.',
      },
      {
        agent: 'HERALD', timestamp: hoursFromNow(-0.2),
        text: 'Full briefing issued to SpaceX Mission Operations. DEFCON 2 declared. All downstream orbital operators in this shell notified.',
      },
    ],
    recommendation: {
      action: 'RETROGRADE BURN',
      deltaV: 0.12,
      fuelCost: 0.08,
      windowCountdown: hoursFromNow(1.5),
    },
  },
  {
    id: 'conj-002',
    primary: SPACE_OBJECTS[2],   // FENGYUN-1C DEB
    secondary: SPACE_OBJECTS[3], // SL-16 R/B
    tca: hoursFromNow(8.1),
    missDistance: 3.4,
    collisionPc: 1.1e-4,
    relVelocity: 11.7,
    defcon: 3,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-1.2),
        text: 'Cross-track convergence detected between two debris-class objects. Neither is maneuverable. Miss distance trending downward over last 3 screening cycles.',
      },
      {
        agent: 'ANALYST', timestamp: hoursFromNow(-1.0),
        text: 'Pc = 1.1×10⁻⁴ — marginally exceeds action threshold. Combined mass ~2,800kg. Fragmentation event would generate estimated 1,200+ trackable debris objects.',
      },
      {
        agent: 'COMMANDER', timestamp: hoursFromNow(-0.8),
        text: 'Neither object is maneuverable. No active mitigation available. Recommend elevated monitoring and pre-positioning of downstream maneuver plans for ISS and constellation assets.',
      },
      {
        agent: 'HERALD', timestamp: hoursFromNow(-0.6),
        text: 'Advisory issued to USSPACECOM, ESA SSA, and ISRO regarding potential debris-generating event. Monitoring cadence increased to 15-minute updates.',
      },
    ],
  },
  {
    id: 'conj-003',
    primary: SPACE_OBJECTS[4],   // IRIDIUM 33 DEB
    secondary: SPACE_OBJECTS[7], // ENVISAT
    tca: hoursFromNow(14.6),
    missDistance: 4.2,
    collisionPc: 4.7e-5,
    relVelocity: 10.2,
    defcon: 4,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-2.0),
        text: 'Iridium-Cosmos debris fragment approaching ENVISAT corridor. Current miss distance within monitoring threshold but not yet critical.',
      },
      {
        agent: 'ANALYST', timestamp: hoursFromNow(-1.8),
        text: 'Pc = 4.7×10⁻⁵ — below mandatory action threshold but above informational limit. ENVISAT mass of 8,211 kg makes this a high-consequence scenario.',
      },
    ],
  },
  {
    id: 'conj-004',
    primary: SPACE_OBJECTS[5],  // COSMOS-2251 DEB
    secondary: SPACE_OBJECTS[6], // STARLINK-1007
    tca: hoursFromNow(22.3),
    missDistance: 2.1,
    collisionPc: 2.8e-4,
    relVelocity: 13.8,
    defcon: 2,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-3.0),
        text: 'High-speed conjunction detected. COSMOS-2251 debris fragment on intercept trajectory with operational Starlink satellite. Closing velocity 13.8 km/s.',
      },
      {
        agent: 'ANALYST', timestamp: hoursFromNow(-2.5),
        text: 'Pc = 2.8×10⁻⁴ — significantly exceeds action threshold. This is a legacy debris fragment from the 2009 Iridium-Cosmos collision, one of 2,300+ catalogued pieces.',
      },
      {
        agent: 'COMMANDER', timestamp: hoursFromNow(-2.0),
        text: 'STARLINK-1007 is maneuverable with autonomous collision avoidance. Recommending prograde burn of Δv = 0.08 m/s at T−1h to increase separation. Autonomous system may act independently.',
      },
      {
        agent: 'HERALD', timestamp: hoursFromNow(-1.5),
        text: 'SpaceX autonomous CA system notified. DEFCON 2 watch initiated. Adjacent Starlink planes alerted to potential cascade risk.',
      },
    ],
    recommendation: {
      action: 'PROGRADE BURN',
      deltaV: 0.08,
      fuelCost: 0.05,
      windowCountdown: hoursFromNow(21.3),
    },
  },
  {
    id: 'conj-005',
    primary: SPACE_OBJECTS[11],  // CZ-6A DEB
    secondary: SPACE_OBJECTS[15], // SL-8 R/B
    tca: hoursFromNow(36.0),
    missDistance: 4.8,
    collisionPc: 2.1e-5,
    relVelocity: 9.3,
    defcon: 5,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-4.0),
        text: 'Low-probability conjunction flagged between PRC launch debris and Soviet-era rocket body. Monitoring initiated.',
      },
      {
        agent: 'ANALYST', timestamp: hoursFromNow(-3.5),
        text: 'Pc = 2.1×10⁻⁵ — well below action threshold. Informational tracking only. Next update at T−12h.',
      },
    ],
  },
  {
    id: 'conj-006',
    primary: SPACE_OBJECTS[12],  // BREEZE-M DEB
    secondary: SPACE_OBJECTS[10], // GLOBALSTAR M069
    tca: hoursFromNow(5.7),
    missDistance: 2.9,
    collisionPc: 1.8e-4,
    relVelocity: 12.1,
    defcon: 3,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-1.5),
        text: 'Breeze-M upper stage debris on approach vector to Globalstar communications satellite. Range closing at 12.1 km/s.',
      },
      {
        agent: 'ANALYST', timestamp: hoursFromNow(-1.2),
        text: 'Pc = 1.8×10⁻⁴ — exceeds action threshold. Globalstar M069 has limited maneuver capability. Fuel reserves estimated at 3.2 kg hydrazine.',
      },
      {
        agent: 'COMMANDER', timestamp: hoursFromNow(-0.9),
        text: 'Limited maneuver recommended. Globalstar ground team should evaluate burn feasibility given fuel constraints and mission timeline.',
      },
      {
        agent: 'HERALD', timestamp: hoursFromNow(-0.7),
        text: 'Globalstar operations center in Milpitas, CA notified. DEFCON 3 advisory issued.',
      },
    ],
  },
  {
    id: 'conj-007',
    primary: SPACE_OBJECTS[13],  // MICROSAT-R DEB
    secondary: SPACE_OBJECTS[16], // ATLAS 5 CENTAUR R/B
    tca: hoursFromNow(47.2),
    missDistance: 4.5,
    collisionPc: 3.6e-5,
    relVelocity: 8.4,
    defcon: 5,
    assessments: [
      {
        agent: 'SENTINEL', timestamp: hoursFromNow(-5.0),
        text: 'ASAT test debris on long-range approach to Atlas Centaur upper stage. Low probability event, standard monitoring.',
      },
    ],
  },
];

// ─── Debris Growth (1957–2026) ────────────────────────────────────────────

export const DEBRIS_GROWTH: DebrisGrowthPoint[] = [
  { year: 1957, count: 1 },
  { year: 1960, count: 58 },
  { year: 1965, count: 480 },
  { year: 1970, count: 1900 },
  { year: 1975, count: 3200 },
  { year: 1980, count: 4800 },
  { year: 1985, count: 6100 },
  { year: 1990, count: 7500 },
  { year: 1995, count: 8200 },
  { year: 2000, count: 9100 },
  { year: 2005, count: 10100 },
  { year: 2007, count: 12800 },  // FY-1C ASAT
  { year: 2009, count: 15200 },  // Iridium-Cosmos
  { year: 2010, count: 15800 },
  { year: 2012, count: 16400 },
  { year: 2014, count: 17000 },
  { year: 2016, count: 17800 },
  { year: 2018, count: 19500 },
  { year: 2020, count: 22300 },
  { year: 2021, count: 25400 },  // RUS ASAT
  { year: 2022, count: 26100 },
  { year: 2023, count: 27200 },
  { year: 2024, count: 27800 },
  { year: 2025, count: 28100 },
  { year: 2026, count: 28441 },
];

// ─── Orbital Shells ───────────────────────────────────────────────────────

export const ORBITAL_SHELLS: OrbitalShell[] = [
  { name: 'LEO 200-400 km', rangeKm: '200–400', count: 2100 },
  { name: 'LEO 400-600 km', rangeKm: '400–600', count: 7200 },
  { name: 'LEO 600-800 km', rangeKm: '600–800', count: 8900 },
  { name: 'LEO 800-1000 km', rangeKm: '800–1000', count: 5300 },
  { name: 'MEO', rangeKm: '1000–35000', count: 2800 },
  { name: 'GEO', rangeKm: '35000+', count: 2141 },
];

// ─── Country Breakdown ───────────────────────────────────────────────────

export const COUNTRY_BREAKDOWN: CountryBreakdown[] = [
  { country: 'USA', count: 8204 },
  { country: 'CIS/RUS', count: 6891 },
  { country: 'PRC', count: 5112 },
  { country: 'ESA', count: 2240 },
  { country: 'JAPAN', count: 1120 },
  { country: 'INDIA', count: 980 },
  { country: 'OTHER', count: 3894 },
];

// ─── Ticker Items ─────────────────────────────────────────────────────────

export const TICKER_ITEMS: TickerItem[] = [
  { agent: 'SENTINEL', message: 'Flagged COSMOS-1500 × STARLINK-2847 — 2h 17m to TCA', objects: ['COSMOS-1500', 'STARLINK-2847'] },
  { agent: 'ANALYST', message: 'Pc update: FENGYUN-1C DEB × SL-16 R/B now 1.1×10⁻⁴', objects: ['FENGYUN-1C DEB', 'SL-16 R/B'] },
  { agent: 'COMMANDER', message: 'Maneuver recommendation issued for STARLINK-2847 — Δv 0.12 m/s retrograde', objects: ['STARLINK-2847'] },
  { agent: 'HERALD', message: 'DEFCON 2 bulletin transmitted to SpaceX Mission Ops', objects: [] },
  { agent: 'SENTINEL', message: 'Routine scan: 47 active conjunctions within 48h window', objects: [] },
  { agent: 'ANALYST', message: 'ENVISAT corridor risk assessment updated — 3 potential encounters this orbit', objects: ['ENVISAT'] },
  { agent: 'COMMANDER', message: 'ISS PDAM evaluation: no maneuver required at this time', objects: ['ISS'] },
  { agent: 'HERALD', message: 'Daily digest transmitted to 18th SDS and CSpOC', objects: [] },
  { agent: 'SENTINEL', message: 'New object detected: CZ-6A debris fragment, cataloguing initiated', objects: [] },
  { agent: 'ANALYST', message: 'Orbital density LEO 600-800km: 12% above quarterly average', objects: [] },
];

// ─── Chat Messages (initial demo) ────────────────────────────────────────

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg-001', role: 'user', timestamp: hoursFromNow(-1),
    text: 'What is the highest priority threat right now?',
  },
  {
    id: 'msg-002', role: 'aegis', agent: 'SENTINEL', timestamp: hoursFromNow(-0.95),
    text: 'The highest-priority event is the COSMOS-1500 × STARLINK-2847 conjunction, currently at DEFCON 2. Time to closest approach is approximately 2 hours 17 minutes. Miss distance is holding at 1.8 km with a collision probability of 3.2×10⁻⁴.',
  },
  {
    id: 'msg-003', role: 'aegis', agent: 'COMMANDER', timestamp: hoursFromNow(-0.9),
    text: 'I have issued a maneuver recommendation for STARLINK-2847. A retrograde burn of Δv = 0.12 m/s at T−45 minutes would increase the miss distance to 8.4 km. This requires 0.08 kg of xenon propellant. The maneuver window opens in 1 hour 29 minutes.',
  },
  {
    id: 'msg-004', role: 'user', timestamp: hoursFromNow(-0.85),
    text: 'How many debris objects originated from the 2007 Chinese ASAT test?',
  },
  {
    id: 'msg-005', role: 'aegis', agent: 'ANALYST', timestamp: hoursFromNow(-0.8),
    text: 'The FY-1C ASAT test on January 11, 2007, generated approximately 3,438 pieces of trackable debris (≥10cm). Of those, an estimated 2,841 remain in orbit as of today. This single event increased the catalogued debris population by roughly 25% and remains the largest debris-generating event in spaceflight history.',
  },
];

// ─── Quick prompts for chat ──────────────────────────────────────────────

export const QUICK_PROMPTS = [
  'Show highest-priority threats',
  'ENVISAT risk assessment',
  'Debris density in LEO 600-800km',
  'Upcoming conjunction windows',
  'Which objects can maneuver?',
];

// ─── Stats for analytics ────────────────────────────────────────────────

export const STAT_STATEMENTS = [
  {
    value: '500,000+',
    text: 'Objects smaller than 10cm that we cannot track, each moving at 28,000 km/h',
  },
  {
    value: '14.3',
    unit: 'km/s',
    text: 'Average collision velocity in LEO — faster than any bullet ever fired',
  },
  {
    value: '1,200+',
    text: 'New trackable fragments created by a single collision between two intact objects',
  },
  {
    value: '8.2',
    unit: 'years',
    text: 'Average time before debris in 800km orbit re-enters atmosphere',
  },
];
