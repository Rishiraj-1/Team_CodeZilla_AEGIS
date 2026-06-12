import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { scanForConjunctions } from '@/lib/orbital';
import { calculatePc, estimateUncertainty } from '@/lib/probability';
import { assignDefcon } from '@/lib/defcon';

export async function POST(req: NextRequest) {
  try {
    // Fetch objects for scanning (LEO objects, altitude 200-2000km)
    const { data: objects, error } = await supabaseAdmin
      .from('objects')
      .select('norad_id, tle_line1, tle_line2, altitude_km, object_type, is_active')
      .not('altitude_km', 'is', null)
      .gte('altitude_km', 200)
      .lte('altitude_km', 2000)
      .limit(400); // Keep scan manageable

    if (error || !objects) {
      return NextResponse.json({ error: error?.message || 'Failed to fetch objects' }, { status: 500 });
    }

    const scanInputs = objects.map(obj => ({
      noradId: obj.norad_id,
      tle1: obj.tle_line1,
      tle2: obj.tle_line2,
      altitudeKm: obj.altitude_km,
    }));

    const objectMap = new Map(objects.map(obj => [obj.norad_id, obj]));

    // Run scan
    const candidates = await scanForConjunctions(scanInputs, {
      horizonHours: 72,
      stepMinutes: 2,
      thresholdKm: 10,
    });

    let newConjunctions = 0;

    for (const candidate of candidates) {
      const objA = objectMap.get(candidate.noradA);
      const objB = objectMap.get(candidate.noradB);
      if (!objA || !objB) continue;

      const sigmaA = estimateUncertainty(objA.object_type, objA.is_active);
      const sigmaB = estimateUncertainty(objB.object_type, objB.is_active);
      const combinedSigma = Math.sqrt(sigmaA ** 2 + sigmaB ** 2);

      const Pc = calculatePc(candidate.missDistanceKm, candidate.relativeVelocityKms, combinedSigma);
      const defcon = assignDefcon(Pc, candidate.missDistanceKm);

      // Only store DEFCON 4 or higher (Pc >= 1e-6) — ignore pure noise
      if (defcon === 5) continue;

      // Check if this conjunction already exists (within 1h of same pair)
      const { data: existing } = await supabaseAdmin
        .from('conjunctions')
        .select('id')
        .eq('object_a_norad', candidate.noradA)
        .eq('object_b_norad', candidate.noradB)
        .eq('status', 'ACTIVE')
        .gte('time_of_closest_approach', new Date(Date.now() - 3600000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert new conjunction
      const { error: insertError } = await supabaseAdmin.from('conjunctions').insert({
        object_a_norad: candidate.noradA,
        object_b_norad: candidate.noradB,
        time_of_closest_approach: candidate.tcaTime.toISOString(),
        miss_distance_km: candidate.missDistanceKm,
        collision_probability: Pc,
        relative_velocity_kms: candidate.relativeVelocityKms,
        defcon_level: defcon,
        status: 'ACTIVE',
        position_a_eci: candidate.positionA,
        position_b_eci: candidate.positionB,
      });

      if (!insertError) newConjunctions++;
    }

    return NextResponse.json({
      scanned: scanInputs.length,
      candidates: candidates.length,
      newConjunctions,
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
