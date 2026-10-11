import type { AgentDecisionOutput, DeterministicScoreResult } from "./types.js";

export type DecisionCategory = "RECOMMENDED" | "BORDERLINE" | "NOT_RECOMMENDED";

export interface DecisionPolicyEvaluation {
  category: DecisionCategory;
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
}

/**
 * Decision Threshold Policy
 * Strictly follows Round_One_Task.pdf:
 * >= 0.75 -> Recommended
 * 0.5 - 0.74 -> Borderline
 * < 0.5 -> Not Recommended
 */
export function evaluateDecisionPolicy(
  scoringResult: DeterministicScoreResult,
  llmReasoningText?: string
): DecisionPolicyEvaluation {
  const score = scoringResult.finalScore;

  let category: DecisionCategory;
  let recommended: boolean;
  let defaultReason = "";

  if (score >= 0.75) {
    category = "RECOMMENDED";
    recommended = true;
    defaultReason = `Strong match (${(score * 100).toFixed(0)}%). Skill match ${(
      scoringResult.skillMatchScore * 100
    ).toFixed(0)}%, experience and location align well with role requirements.`;
  } else if (score >= 0.5) {
    category = "BORDERLINE";
    recommended = false; // Borderline candidates are not automatically recommended
    defaultReason = `Borderline match (${(score * 100).toFixed(0)}%). Candidate meets partial requirements: skill ${(
      scoringResult.skillMatchScore * 100
    ).toFixed(0)}%, experience ${(
      scoringResult.experienceMatchScore * 100
    ).toFixed(0)}%. Manual review advised.`;
  } else {
    category = "NOT_RECOMMENDED";
    recommended = false;
    defaultReason = `Below threshold match (${(score * 100).toFixed(0)}%). Insufficient skill overlap or experience for contract specifications.`;
  }

  // Calculate confidence score based on scoring margin
  // Scores far from boundary (0.5 and 0.75) have higher confidence
  const distFromBoundary = Math.min(
    Math.abs(score - 0.5),
    Math.abs(score - 0.75)
  );
  const confidence = Number(
    Math.min(0.99, Math.max(0.7, 0.75 + distFromBoundary * 0.5)).toFixed(2)
  );

  return {
    category,
    recommended,
    score,
    confidence,
    reason: llmReasoningText && llmReasoningText.length > 10 ? llmReasoningText : defaultReason,
  };
}

/**
 * Validates agent decision consistency against deterministic scores
 */
export function enforceDecisionConsistency(
  agentOutput: AgentDecisionOutput,
  deterministicScore: DeterministicScoreResult
): AgentDecisionOutput {
  const score = deterministicScore.finalScore;
  const policy = evaluateDecisionPolicy(deterministicScore, agentOutput.reason);

  return {
    recommended: policy.recommended,
    score: score,
    confidence: Number(agentOutput.confidence || policy.confidence),
    reason: agentOutput.reason || policy.reason,
  };
}
