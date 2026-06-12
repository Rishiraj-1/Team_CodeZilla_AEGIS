import { generateContentSafe } from '@/lib/gemini';
import type { ConjunctionCandidate } from '@/lib/orbital';

const SENTINEL_SYSTEM_PROMPT = `You are SENTINEL, the orbital scanning agent for AEGIS — Autonomous Earth-Orbit Guardian & Intelligence System.

Your role: Analyze newly detected orbital conjunction events and determine if they warrant escalation to the full AEGIS agent pipeline.

You receive structured data about a close approach event between two orbital objects.
You output a precise technical assessment.

Output ONLY valid JSON matching this exact schema — no markdown, no explanation outside JSON:
{
  "flagged": boolean,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reasoning": string,
  "escalate": boolean,
  "monitoringIntervalSeconds": number,
  "notes": string
}

Rules:
- reasoning: 3-4 sentences. Use orbital mechanics terminology. Reference miss distance, approach geometry, SGP4 propagation quality. Be specific.
- flagged: true if miss distance < 10km
- escalate: true if miss distance < 5km or Pc > 1e-5
- monitoringIntervalSeconds: 30 for critical, 120 for high, 300 for medium, 600 for low
- notes: one sentence about what makes this conjunction notable or routine`;

export interface SentinelOutput {
  flagged: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  escalate: boolean;
  monitoringIntervalSeconds: number;
  notes: string;
}

export async function runSentinel(
  conjunction: ConjunctionCandidate,
  objectAName: string,
  objectBName: string,
  objectAType: string,
  objectBType: string,
  Pc: number
): Promise<SentinelOutput> {
  const userMessage = `Conjunction detection report:

PRIMARY OBJECT: ${objectAName} (NORAD: ${conjunction.noradA})
  Type: ${objectAType}

SECONDARY OBJECT: ${objectBName} (NORAD: ${conjunction.noradB})
  Type: ${objectBType}

CONJUNCTION PARAMETERS:
  Time of Closest Approach (TCA): ${conjunction.tcaTime.toISOString()}
  Miss Distance: ${conjunction.missDistanceKm.toFixed(3)} km
  Relative Velocity at TCA: ${conjunction.relativeVelocityKms.toFixed(2)} km/s
  Computed Collision Probability (Pc): ${Pc.toExponential(2)}
  Hours to TCA: ${((conjunction.tcaTime.getTime() - Date.now()) / 3600000).toFixed(1)}h

Assess this conjunction and provide your sentinel evaluation.`;

  const text = await generateContentSafe(userMessage, {
    systemInstruction: SENTINEL_SYSTEM_PROMPT,
    responseMimeType: 'application/json',
    timeoutMs: 30000,
  });

  try {
    const parsed = JSON.parse(text) as SentinelOutput;
    return parsed;
  } catch {
    // Fallback if JSON parsing fails
    return {
      flagged: conjunction.missDistanceKm < 10,
      severity: conjunction.missDistanceKm < 3 ? 'CRITICAL' : 'HIGH',
      reasoning: text.substring(0, 400),
      escalate: conjunction.missDistanceKm < 5,
      monitoringIntervalSeconds: 120,
      notes: 'Parsed from raw response due to JSON error.',
    };
  }
}
