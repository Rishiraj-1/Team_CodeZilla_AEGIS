import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runSentinel } from '@/lib/agents/sentinel';
import { runAnalyst } from '@/lib/agents/analyst';
import { runCommander } from '@/lib/agents/commander';
import { runHerald } from '@/lib/agents/herald';

export async function POST(req: NextRequest) {
  try {
    // Get active conjunctions without HERALD logs (not yet fully processed)
    const { data: conjunctions, error } = await supabaseAdmin
      .from('conjunctions')
      .select(`
        *,
        object_a:objects!conjunctions_object_a_norad_fkey(norad_id, name, object_type, is_active),
        object_b:objects!conjunctions_object_b_norad_fkey(norad_id, name, object_type, is_active),
        agent_logs(agent_name, reasoning, output)
      `)
      .eq('status', 'ACTIVE')
      .lte('defcon_level', 3) // Only process DEFCON 3 and above (Elevated, Critical, Emergency)
      .order('defcon_level', { ascending: true })
      .limit(5); // Process max 5 per run to stay within API rate limits

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!conjunctions || conjunctions.length === 0) {
      return NextResponse.json({ message: 'No unprocessed conjunctions found.' });
    }

    // Filter to those actually missing HERALD log
    const unprocessed = conjunctions.filter(c => {
      const logs = c.agent_logs || [];
      return !logs.some((l: any) => l.agent_name === 'HERALD');
    });

    if (unprocessed.length === 0) {
      return NextResponse.json({ message: 'All fetched conjunctions are already processed.' });
    }

    const results = [];

    for (const conj of unprocessed) {
      const objA = conj.object_a;
      const objB = conj.object_b;
      if (!objA || !objB) continue;

      const existingLogs = conj.agent_logs || [];
      
      // 1. SENTINEL AGENT
      let sentinelOutput = existingLogs.find((l: any) => l.agent_name === 'SENTINEL')?.output;
      let sentinelReasoning = existingLogs.find((l: any) => l.agent_name === 'SENTINEL')?.reasoning;
      
      if (!sentinelOutput) {
        const start = Date.now();
        sentinelOutput = await runSentinel(
          {
            noradA: conj.object_a_norad,
            noradB: conj.object_b_norad,
            tcaTime: new Date(conj.time_of_closest_approach),
            missDistanceKm: conj.miss_distance_km,
            relativeVelocityKms: conj.relative_velocity_kms,
            positionA: conj.position_a_eci,
            positionB: conj.position_b_eci
          },
          objA.name,
          objB.name,
          objA.object_type,
          objB.object_type,
          conj.collision_probability
        );
        sentinelReasoning = sentinelOutput.reasoning;
        const duration = Date.now() - start;

        await supabaseAdmin.from('agent_logs').insert({
          conjunction_id: conj.id,
          agent_name: 'SENTINEL',
          reasoning: sentinelReasoning,
          output: sentinelOutput,
          processing_ms: duration
        });
      }

      // 2. ANALYST AGENT
      let analystOutput = existingLogs.find((l: any) => l.agent_name === 'ANALYST')?.output;
      let analystReasoning = existingLogs.find((l: any) => l.agent_name === 'ANALYST')?.reasoning;

      const shouldEscalateFromSentinel = sentinelOutput.escalate || conj.miss_distance_km < 5;

      if (shouldEscalateFromSentinel && !analystOutput) {
        const start = Date.now();
        const tcaHours = (new Date(conj.time_of_closest_approach).getTime() - Date.now()) / 3600000;
        
        analystOutput = await runAnalyst(
          {
            objectAName: objA.name,
            objectBName: objB.name,
            objectAType: objA.object_type,
            objectBType: objB.object_type,
            objectAActive: objA.is_active,
            objectBActive: objB.is_active,
            missDistanceKm: conj.miss_distance_km,
            relVelocityKms: conj.relative_velocity_kms,
            Pc: conj.collision_probability,
            tcaHours
          },
          sentinelOutput
        );
        analystReasoning = analystOutput.reasoning;
        const duration = Date.now() - start;

        await supabaseAdmin.from('agent_logs').insert({
          conjunction_id: conj.id,
          agent_name: 'ANALYST',
          reasoning: analystReasoning,
          output: analystOutput,
          processing_ms: duration
        });

        // Update conjunction risk parameters if analyst refined them
        await supabaseAdmin.from('conjunctions').update({
          defcon_level: analystOutput.defconLevel,
          collision_probability: analystOutput.collisionProbability
        }).eq('id', conj.id);

        // Update risk scores for the involved objects
        const newScoreA = Math.min(100, (objA.risk_score || 0) + (6 - analystOutput.defconLevel) * 10);
        const newScoreB = Math.min(100, (objB.risk_score || 0) + (6 - analystOutput.defconLevel) * 10);
        await supabaseAdmin.from('objects').update({ risk_score: newScoreA }).eq('norad_id', conj.object_a_norad);
        await supabaseAdmin.from('objects').update({ risk_score: newScoreB }).eq('norad_id', conj.object_b_norad);
      }

      // If Sentinel didn't escalate, create fallback analyst assessment
      if (!shouldEscalateFromSentinel && !analystOutput) {
        analystOutput = {
          collisionProbability: conj.collision_probability,
          defconLevel: conj.defcon_level,
          uncertaintyAssessment: 'No deep analysis requested due to low initial severity.',
          historicalContext: 'N/A',
          comparedToNasaThreshold: 'Below threshold',
          reasoning: 'Conjunction severity is low. Escalation bypassed.',
          recommendEscalate: false
        };
        analystReasoning = analystOutput.reasoning;
      }

      // 3. COMMANDER AGENT
      let commanderOutput = existingLogs.find((l: any) => l.agent_name === 'COMMANDER')?.output;
      let commanderReasoning = existingLogs.find((l: any) => l.agent_name === 'COMMANDER')?.reasoning;

      const currentDefcon = analystOutput.defconLevel || conj.defcon_level;
      const shouldManeuver = analystOutput.recommendEscalate || currentDefcon <= 2;

      if (shouldManeuver && !commanderOutput) {
        const start = Date.now();
        const tcaHours = (new Date(conj.time_of_closest_approach).getTime() - Date.now()) / 3600000;

        commanderOutput = await runCommander(
          {
            objectANorad: conj.object_a_norad,
            objectAName: objA.name,
            objectAType: objA.object_type,
            objectAActive: objA.is_active,
            objectBNorad: conj.object_b_norad,
            objectBName: objB.name,
            objectBType: objB.object_type,
            objectBActive: objB.is_active,
            missDistanceKm: conj.miss_distance_km,
            relVelocityKms: conj.relative_velocity_kms,
            Pc: conj.collision_probability,
            tcaHours,
            defconLevel: currentDefcon
          },
          analystOutput
        );
        commanderReasoning = commanderOutput.reasoning;
        const duration = Date.now() - start;

        await supabaseAdmin.from('agent_logs').insert({
          conjunction_id: conj.id,
          agent_name: 'COMMANDER',
          reasoning: commanderReasoning,
          output: commanderOutput,
          processing_ms: duration
        });

        // Issue maneuver in DB
        if (commanderOutput.goNoGo === 'GO') {
          await supabaseAdmin.from('conjunctions').update({
            status: 'MANEUVER_ISSUED'
          }).eq('id', conj.id);
        }
      }

      // Fallback commander output if maneuver planning was bypassed
      if (!shouldManeuver && !commanderOutput) {
        commanderOutput = {
          maneuverableObjectNorad: null,
          maneuverableObjectName: null,
          maneuverType: 'NONE',
          deltaVms: 0,
          burnWindowMinsBefore: 0,
          latestBurnWindowMinsBefore: 0,
          fuelCostKg: 0,
          postManeuverMissDistKm: conj.miss_distance_km,
          goNoGo: 'MONITOR',
          reasoning: 'Nominal flyby expected. Avoidance maneuver unnecessary.'
        };
        commanderReasoning = commanderOutput.reasoning;
      }

      // 4. HERALD AGENT
      const startHerald = Date.now();
      const heraldOutput = await runHerald({
        objectAName: objA.name,
        objectBName: objB.name,
        missDistanceKm: conj.miss_distance_km,
        Pc: conj.collision_probability,
        tcaISO: conj.time_of_closest_approach,
        defconLevel: currentDefcon,
        sentinelReasoning,
        analystReasoning,
        commanderOutput
      });
      const durationHerald = Date.now() - startHerald;

      await supabaseAdmin.from('agent_logs').insert({
        conjunction_id: conj.id,
        agent_name: 'HERALD',
        reasoning: heraldOutput.bulletinText,
        output: heraldOutput,
        processing_ms: durationHerald
      });

      // Update status to MONITORING if sentinel flagged it but no maneuver issued
      if (sentinelOutput.flagged && conj.status === 'ACTIVE' && commanderOutput.goNoGo !== 'GO') {
        await supabaseAdmin.from('conjunctions').update({
          status: 'MONITORING'
        }).eq('id', conj.id);
      }

      results.push({
        conjunctionId: conj.id,
        defcon: currentDefcon,
        sentinel: sentinelOutput.severity,
        analystEscalated: shouldEscalateFromSentinel,
        commanderDecision: commanderOutput.goNoGo,
        bulletin: heraldOutput.headline
      });
    }

    return NextResponse.json({ processedCount: results.length, details: results });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
