/**
 * Orbital mechanics utilities for AEGIS
 */

/** Earth radius in km */
export const EARTH_RADIUS_KM = 6371;

/**
 * Convert altitude (km) to globe.gl altitude units
 * The globe uses a scale where Earth's radius = 1
 */
export function altitudeToGlobeUnits(altitudeKm: number): number {
  return altitudeKm / EARTH_RADIUS_KM;
}

/**
 * Orbital period in minutes given altitude (circular orbit approximation)
 * T = 2π × sqrt(r³/μ)
 * μ = 3.986e5 km³/s²
 */
export function orbitalPeriod(altitudeKm: number): number {
  const r = EARTH_RADIUS_KM + altitudeKm;
  const mu = 3.986e5;
  const T = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / mu);
  return T / 60; // convert seconds to minutes
}

/**
 * Orbital velocity in km/s given altitude (circular orbit)
 */
export function orbitalVelocity(altitudeKm: number): number {
  const r = EARTH_RADIUS_KM + altitudeKm;
  const mu = 3.986e5;
  return Math.sqrt(mu / r);
}

/**
 * Classify orbit by altitude
 */
export function orbitClassification(altitudeKm: number): string {
  if (altitudeKm < 200) return 'SUB-ORBITAL';
  if (altitudeKm < 2000) return 'LEO';
  if (altitudeKm < 35786) return 'MEO';
  if (altitudeKm < 35800) return 'GEO';
  return 'HEO';
}
