import { generateContentSafe } from '@/lib/gemini';

const HERALD_SYSTEM_PROMPT = `You are HERALD, the mission briefing agent for AEGIS.

Your role: Synthesize all preceding agent analyses into a clear, human-readable intelligence bulletin suitable for mission directors and orbital operators.

Output ONLY valid JSON:
{
  "headline": string,
  "summary": string,
  "actionRequired": boolean,
  "actionDeadlineISO": string | null,
  "bulletinText": string,
  "reasoning": string
}

Rules:
- headline: max 12 words, present tense, states the threat in plain language
- summary: 2-3 sentences, no jargon. What happened, how bad, what to do.
- actionRequired: true if DEFCON 1-2
- actionDeadlineISO: ISO timestamp of latest actionable window (burn window close time), null if no action possible
- bulletinText: 4-6 sentences in formal mission report format. Include specific numbers. State DEFCON. Name objects. State Pc. State recommended action and deadline.
- reasoning: 2 sentences on what this bulletin prioritizes and why

Write as if briefing a mission director who has 30 seconds to decide.
Be decisive. No hedging. Use exact numbers.`;

export interface HeraldOutput {
  headline: string;
  summary: string;
  actionRequired: boolean;
  actionDeadlineISO: string | null;
  bulletinText: string;
  reasoning: string;
}

export async function runHerald(
  allAgentData: {
    objectAName: string; objectBName: string;
    missDistanceKm: number; Pc: number; tcaISO: string; defconLevel: number;
    sentinelReasoning: string;
    analystReasoning: string;
    commanderOutput: { goNoGo: string; deltaVms: number; burnWindowMinsBefore: number; maneuverableObjectName: string | null };
  }
): Promise<HeraldOutput> {
  const userMessage = `Briefing synthesis required:

CONJUNCTION: ${allAgentData.objectAName} × ${allAgentData.objectBName}
DEFCON: ${allAgentData.defconLevel}
TCA: ${allAgentData.tcaISO}
MISS DISTANCE: ${allAgentData.missDistanceKm.toFixed(3)} km
COLLISION Pc: ${allAgentData.Pc.toExponential(3)}

SENTINEL: ${allAgentData.sentinelReasoning.substring(0, 200)}
ANALYST: ${allAgentData.analystReasoning.substring(0, 200)}
COMMANDER: ${allAgentData.commanderOutput.goNoGo} — ${allAgentData.commanderOutput.deltaVms}m/s burn ${allAgentData.commanderOutput.burnWindowMinsBefore}min before TCA on ${allAgentData.commanderOutput.maneuverableObjectName || 'no maneuverable object'}

Generate mission briefing bulletin.`;

  const text = await generateContentSafe(userMessage, {
    systemInstruction: HERALD_SYSTEM_PROMPT,
    responseMimeType: 'application/json',
    timeoutMs: 10000,
  });

  try {
    return JSON.parse(text) as HeraldOutput;
  } catch {
    return {
      headline: `DEFCON ${allAgentData.defconLevel}: ${allAgentData.objectAName} × ${allAgentData.objectBName}`,
      summary: `Close approach detected at ${allAgentData.missDistanceKm.toFixed(1)}km. Collision probability ${allAgentData.Pc.toExponential(2)}.`,
      actionRequired: allAgentData.defconLevel <= 2,
      actionDeadlineISO: null,
      bulletinText: text.substring(0, 500),
      reasoning: 'Bulletin generated from raw response due to parse error.',
    };
  }
}
