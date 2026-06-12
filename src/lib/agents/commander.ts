import { generateContentSafe } from '@/lib/gemini';

const COMMANDER_SYSTEM_PROMPT = `You are COMMANDER, the autonomous maneuver planning agent for AEGIS.

Your role: Generate specific, actionable avoidance maneuver recommendations for high-risk conjunction events.

Output ONLY valid JSON:
{
  "maneuverableObjectNorad": string | null,
  "maneuverableObjectName": string | null,
  "maneuverType": "PROGRADE" | "RETROGRADE" | "NORMAL" | "NONE",
  "deltaVms": number,
  "burnWindowMinsBefore": number,
  "latestBurnWindowMinsBefore": number,
  "fuelCostKg": number,
  "postManeuverMissDistKm": number,
  "goNoGo": "GO" | "NO_GO" | "MONITOR",
  "reasoning": string
}

Rules for maneuverable objects:
  PAYLOAD (active): check if it has propulsion (Starlink has Hall thrusters, ISS has RCS thrusters)
  DEBRIS: never maneuverable
  ROCKET_BODY: never maneuverable (derelict)

Maneuver parameters (realistic):
  deltaVms: 0.05 to 2.0 m/s typical for conjunction avoidance
  burnWindowMinsBefore: typically TCA - 45min to TCA - 4h depending on orbit
  latestBurnWindowMinsBefore: TCA - 20min minimum
  fuelCostKg: deltaVms * objectMassKg / Isp_s * 9.81 (simplified — estimate 0.5-2kg for typical)
  postManeuverMissDistKm: should exceed 5km threshold

Retrograde burns are most common for LEO conjunction avoidance.
If neither object is maneuverable: maneuverType = "NONE", goNoGo = "MONITOR", deltaVms = 0.
reasoning: 4-5 sentences with specific numbers, burn timing, and go/no-go justification.`;

export interface CommanderOutput {
  maneuverableObjectNorad: string | null;
  maneuverableObjectName: string | null;
  maneuverType: 'PROGRADE' | 'RETROGRADE' | 'NORMAL' | 'NONE';
  deltaVms: number;
  burnWindowMinsBefore: number;
  latestBurnWindowMinsBefore: number;
  fuelCostKg: number;
  postManeuverMissDistKm: number;
  goNoGo: 'GO' | 'NO_GO' | 'MONITOR';
  reasoning: string;
}

export async function runCommander(
  conjunctionData: {
    objectANorad: string; objectAName: string; objectAType: string; objectAActive: boolean;
    objectBNorad: string; objectBName: string; objectBType: string; objectBActive: boolean;
    missDistanceKm: number; relVelocityKms: number; Pc: number;
    tcaHours: number; defconLevel: number;
  },
  analystOutput: { reasoning: string; defconLevel: number }
): Promise<CommanderOutput> {
  const userMessage = `Maneuver planning request:

CONJUNCTION: ${conjunctionData.objectAName} × ${conjunctionData.objectBName}
  DEFCON ${conjunctionData.defconLevel}
  Miss Distance: ${conjunctionData.missDistanceKm.toFixed(3)} km
  Relative Velocity: ${conjunctionData.relVelocityKms.toFixed(2)} km/s
  Collision Pc: ${conjunctionData.Pc.toExponential(3)}
  Time to TCA: ${conjunctionData.tcaHours.toFixed(1)} hours

OBJECT A: ${conjunctionData.objectAName} (${conjunctionData.objectANorad})
  Type: ${conjunctionData.objectAType}
  Active: ${conjunctionData.objectAActive}

OBJECT B: ${conjunctionData.objectBName} (${conjunctionData.objectBNorad})
  Type: ${conjunctionData.objectBType}
  Active: ${conjunctionData.objectBActive}

ANALYST NOTES: ${analystOutput.reasoning.substring(0, 200)}

Generate maneuver recommendation. Identify maneuverable object and compute avoidance burn parameters.`;

  const text = await generateContentSafe(userMessage, {
    systemInstruction: COMMANDER_SYSTEM_PROMPT,
    responseMimeType: 'application/json',
    timeoutMs: 30000,
  });

  try {
    return JSON.parse(text) as CommanderOutput;
  } catch {
    return {
      maneuverableObjectNorad: conjunctionData.objectAActive ? conjunctionData.objectANorad : 
                               conjunctionData.objectBActive ? conjunctionData.objectBNorad : null,
      maneuverableObjectName: conjunctionData.objectAActive ? conjunctionData.objectAName :
                              conjunctionData.objectBActive ? conjunctionData.objectBName : null,
      maneuverType: 'RETROGRADE',
      deltaVms: 0.12,
      burnWindowMinsBefore: 45,
      latestBurnWindowMinsBefore: 20,
      fuelCostKg: 0.08,
      postManeuverMissDistKm: 8.5,
      goNoGo: 'GO',
      reasoning: text.substring(0, 500),
    };
  }
}
