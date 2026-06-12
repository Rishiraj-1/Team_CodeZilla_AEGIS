// Collision probability using simplified Foster-Estes formulation.
// This is a reasonable approximation used by many conjunction screening tools.
// Full implementation would require covariance matrices from tracking data.

/**
 * Compute collision probability (Pc) for a conjunction event.
 *
 * @param missDistanceKm  - Predicted miss distance in km
 * @param relVelocityKms  - Relative velocity at TCA in km/s
 * @param sigmaKm         - Combined position uncertainty (1-sigma, km)
 *                          Default: 0.2 km (200m) — typical LEO tracking quality
 * @param combinedRadiusKm - Combined hard-body radius (km)
 *                          Default: 0.006 km (6m) — typical satellite + debris
 */
export function calculatePc(
  missDistanceKm: number,
  relVelocityKms: number,
  sigmaKm: number = 0.2,
  combinedRadiusKm: number = 0.006
): number {
  // Avoid division by zero
  if (sigmaKm <= 0 || relVelocityKms <= 0) return 0;

  // Combined cross-sectional area
  const Ac = Math.PI * combinedRadiusKm * combinedRadiusKm;

  // 2D probability of being within combined radius at TCA
  // Using 2D Gaussian approximation in the collision plane
  const exponent = -0.5 * (missDistanceKm * missDistanceKm) / (sigmaKm * sigmaKm);
  const gaussian = Math.exp(exponent);

  // Pc = (Ac / (2π * σ²)) * exp(-d²/2σ²)
  const Pc = (Ac / (2 * Math.PI * sigmaKm * sigmaKm)) * gaussian;

  return Math.min(1, Math.max(0, Pc));
}

/**
 * Estimate position uncertainty based on object type and tracking history.
 * Real tracking data would provide actual covariance matrices.
 * These are representative values for demo purposes.
 */
export function estimateUncertainty(objectType: string, isActive: boolean): number {
  if (!isActive) {
    // Inactive/debris objects have higher uncertainty
    return objectType === 'DEBRIS' ? 0.35 : 0.25; // 350m / 250m
  }
  // Active satellites with GPS: ~100m uncertainty
  return 0.1;
}
