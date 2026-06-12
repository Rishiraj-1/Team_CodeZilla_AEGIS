import { generateContentSafe } from '@/lib/gemini';

const ANALYST_SYSTEM_PROMPT = `You are ANALYST, the risk quantification agent for AEGIS.

Your role: Perform deep probabilistic risk assessment of flagged conjunction events. You receive data from SENTINEL and the raw orbital parameters.

Output ONLY valid JSON:
{
  "collisionProbability": number,
  "defconLevel": 1 | 2 | 3 | 4 | 5,
  "uncertaintyAssessment": string,
  "historicalContext": string,
  "comparedToNasaThreshold": string,
  "reasoning": string,
  "recommendEscalate": boolean
}

Rules:
- collisionProbability: use the provided Pc but you may refine based on uncertainty notes
- defconLevel: 1 (Pc≥1e-3 or miss<1km), 2 (Pc≥1e-4), 3 (Pc≥1e-5), 4 (Pc≥1e-6), 5 (Pc<1e-6)
- reasoning: 4-5 sentences with specific numbers. Reference NASA STD-8719.14. Cite 1e-4 mandatory action threshold.
- uncertaintyAssessment: one sentence on position uncertainty quality for these object types
- historicalContext: one sentence comparing to known events (Iridium-Cosmos 2009, FY-1C 2007, etc.) if relevant
- comparedToNasaThreshold: "Exceeds by Xm factor" or "Below threshold"`;

export interface AnalystOutput {
  collisionProbability: number;
  defconLevel: 1 | 2 | 3 | 4 | 5;
  uncertaintyAssessment: string;
  historicalContext: string;
  comparedToNasaThreshold: string;
  reasoning: string;
  recommendEscalate: boolean;
}

export async function runAnalyst(
  conjunctionData: {
    objectAName: string;
    objectBName: string;
    objectAType: string;
    objectBType: string;
    objectAActive: boolean;
    objectBActive: boolean;
    missDistanceKm: number;
    relVelocityKms: number;
    Pc: number;
    tcaHours: number;
  },
  sentinelOutput: { severity: string; reasoning: string }
): Promise<AnalystOutput> {
  const userMessage = `Risk assessment request:

CONJUNCTION: ${conjunctionData.objectAName} × ${conjunctionData.objectBName}
  Object A type: ${conjunctionData.objectAType} (${conjunctionData.objectAActive ? 'ACTIVE' : 'INACTIVE'})
  Object B type: ${conjunctionData.objectBType} (${conjunctionData.objectBActive ? 'ACTIVE' : 'INACTIVE'})

ORBITAL PARAMETERS:
  Miss Distance:      ${conjunctionData.missDistanceKm.toFixed(3)} km
  Relative Velocity:  ${conjunctionData.relVelocityKms.toFixed(2)} km/s
  Computed Pc:        ${conjunctionData.Pc.toExponential(3)}
  Hours to TCA:       ${conjunctionData.tcaHours.toFixed(1)}h

SENTINEL ASSESSMENT:
  Severity: ${conjunctionData.missDistanceKm < 3 ? 'CRITICAL' : 'HIGH'}
  ${sentinelOutput.reasoning}

Provide full risk quantification and DEFCON assignment.`;

  const text = await generateContentSafe(userMessage, {
    systemInstruction: ANALYST_SYSTEM_PROMPT,
    responseMimeType: 'application/json',
    timeoutMs: 30000,
  });

  try {
    return JSON.parse(text) as AnalystOutput;
  } catch {
    return {
      collisionProbability: conjunctionData.Pc,
      defconLevel: conjunctionData.Pc >= 1e-4 ? 2 : conjunctionData.Pc >= 1e-5 ? 3 : 4,
      uncertaintyAssessment: 'Standard LEO tracking quality assumed.',
      historicalContext: 'No direct historical parallel identified.',
      comparedToNasaThreshold: conjunctionData.Pc >= 1e-4 ? 'Exceeds mandatory action threshold' : 'Below action threshold',
      reasoning: text.substring(0, 500),
      recommendEscalate: conjunctionData.Pc >= 1e-4,
    };
  }
}
