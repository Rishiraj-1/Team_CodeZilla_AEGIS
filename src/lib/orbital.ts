import * as satellite from 'satellite.js';

export interface OrbitalPosition {
  lat: number;       // degrees
  lng: number;       // degrees
  altKm: number;     // altitude in km
  x: number;         // ECI x (km)
  y: number;         // ECI y (km)
  z: number;         // ECI z (km)
  vx: number;        // velocity x (km/s)
  vy: number;        // velocity y (km/s)
  vz: number;        // velocity z (km/s)
}

export interface ConjunctionCandidate {
  noradA: string;
  noradB: string;
  tcaTime: Date;
  missDistanceKm: number;
  relativeVelocityKms: number;
  positionA: { x: number; y: number; z: number };
  positionB: { x: number; y: number; z: number };
}

// Propagate a TLE to a specific time — returns ECI position + geodetic
export function propagateTLE(
  tle1: string,
  tle2: string,
  time: Date
): OrbitalPosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const pv = satellite.propagate(satrec, time);

    if (!pv || typeof pv.position === 'boolean' || typeof pv.velocity === 'boolean') {
      return null; // Object has decayed or invalid TLE
    }

    const pos = pv.position as satellite.EciVec3<number>;
    const vel = pv.velocity as satellite.EciVec3<number>;
    const gmst = satellite.gstime(time);
    const geo = satellite.eciToGeodetic(pos, gmst);

    return {
      lat: satellite.degreesLat(geo.latitude),
      lng: satellite.degreesLong(geo.longitude),
      altKm: geo.height,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      vx: vel.x,
      vy: vel.y,
      vz: vel.z,
    };
  } catch {
    return null;
  }
}

// Compute distance between two ECI positions (km)
export function eciDistance(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    Math.pow(b.x - a.x, 2) +
    Math.pow(b.y - a.y, 2) +
    Math.pow(b.z - a.z, 2)
  );
}

// Compute relative velocity magnitude (km/s) between two objects
export function relativeVelocity(
  va: { x: number; y: number; z: number },
  vb: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    Math.pow(vb.x - va.x, 2) +
    Math.pow(vb.y - va.y, 2) +
    Math.pow(vb.z - va.z, 2)
  );
}

// Compute altitude from TLE (derived from mean motion)
export function computeAltitude(tle1: string, tle2: string): number | null {
  try {
    const pos = propagateTLE(tle1, tle2, new Date());
    return pos ? pos.altKm : null;
  } catch {
    return null;
  }
}

// Compute period in minutes from mean motion (rev/day in TLE)
export function computePeriod(tle2: string): number {
  // Mean motion is in field 8 of TLE line 2 (revs per day)
  const parts = tle2.trim().split(/\s+/);
  const meanMotionRevDay = parseFloat(parts[7]);
  return 1440 / meanMotionRevDay; // 1440 min/day ÷ rev/day = min/rev
}

// CONJUNCTION DETECTION
// Scans a list of objects for close approaches over a time window.
// Uses coarse-then-fine approach for performance:
//   1. Coarse: filter to objects in similar altitude bands (±100km)
//   2. Fine: propagate filtered pairs at 2-minute steps over 72h
//
// WARNING: Full scan of N objects is O(N²) — for 1000 objects that's 500k pairs.
// Limit scan size for performance.

export interface ScanInput {
  noradId: string;
  tle1: string;
  tle2: string;
  altitudeKm: number;
}

export async function scanForConjunctions(
  objects: ScanInput[],
  options: {
    horizonHours?: number;     // How far forward to scan (default 72h)
    stepMinutes?: number;      // Time step for propagation (default 2min)
    thresholdKm?: number;      // Flag conjunctions below this distance (default 10km)
    batchSize?: number;        // Max objects to scan (default 300)
  } = {}
): Promise<ConjunctionCandidate[]> {
  const {
    horizonHours = 72,
    stepMinutes = 2,
    thresholdKm = 10,
    batchSize = 300
  } = options;

  // Limit scan size for performance
  const batch = objects.slice(0, batchSize);

  const now = new Date();
  const stepMs = stepMinutes * 60 * 1000;
  const steps = Math.floor((horizonHours * 60) / stepMinutes);

  const candidates: ConjunctionCandidate[] = [];

  // Coarse filter: group objects by altitude band (100km bands)
  const altBands = new Map<number, ScanInput[]>();
  for (const obj of batch) {
    const band = Math.floor(obj.altitudeKm / 100);
    if (!altBands.has(band)) altBands.set(band, []);
    altBands.get(band)!.push(obj);
  }

  // Only compare objects in same or adjacent altitude bands
  const pairsToCheck: [ScanInput, ScanInput][] = [];
  const bands = Array.from(altBands.entries());

  for (let i = 0; i < bands.length; i++) {
    const [bandNum, bandObjects] = bands[i];

    // Same-band pairs
    for (let a = 0; a < bandObjects.length; a++) {
      for (let b = a + 1; b < bandObjects.length; b++) {
        pairsToCheck.push([bandObjects[a], bandObjects[b]]);
      }
    }

    // Adjacent-band pairs (±1 band = ±100km)
    const adjacentBand = altBands.get(bandNum + 1);
    if (adjacentBand) {
      for (const objA of bandObjects) {
        for (const objB of adjacentBand) {
          pairsToCheck.push([objA, objB]);
        }
      }
    }
  }

  // Fine scan: propagate each pair through time steps
  for (const [objA, objB] of pairsToCheck) {
    let minDist = Infinity;
    let tcaTime = now;
    let tcaPosA = { x: 0, y: 0, z: 0 };
    let tcaPosB = { x: 0, y: 0, z: 0 };
    let tcaRelV = 0;

    for (let step = 0; step <= steps; step++) {
      const t = new Date(now.getTime() + step * stepMs);

      const posA = propagateTLE(objA.tle1, objA.tle2, t);
      const posB = propagateTLE(objB.tle1, objB.tle2, t);

      if (!posA || !posB) continue;

      const dist = eciDistance(posA, posB);

      if (dist < minDist) {
        minDist = dist;
        tcaTime = t;
        tcaPosA = { x: posA.x, y: posA.y, z: posA.z };
        tcaPosB = { x: posB.x, y: posB.y, z: posB.z };
        tcaRelV = relativeVelocity(
          { x: posA.vx, y: posA.vy, z: posA.vz },
          { x: posB.vx, y: posB.vy, z: posB.vz }
        );
      }
    }

    // Only flag if below threshold
    if (minDist < thresholdKm) {
      candidates.push({
        noradA: objA.noradId,
        noradB: objB.noradId,
        tcaTime,
        missDistanceKm: minDist,
        relativeVelocityKms: tcaRelV,
        positionA: tcaPosA,
        positionB: tcaPosB,
      });
    }
  }

  // Sort by miss distance (closest first)
  return candidates.sort((a, b) => a.missDistanceKm - b.missDistanceKm);
}
