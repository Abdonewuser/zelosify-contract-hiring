import type { DeterministicScoreResult } from "./types.js";

/**
 * Deterministic Matching Engine
 * Implements the exact business logic and scoring formula from Round_One_Task.pdf
 */

/**
 * Experience Logic:
 * if candidateExp < min -> 0
 * if within range -> 1
 * if above max -> 0.8
 */
export function calculateExperienceScore(
  candidateExp: number,
  experienceMin: number,
  experienceMax?: number | null
): number {
  if (candidateExp < experienceMin) {
    return 0;
  }

  // If there's an experienceMax defined
  if (experienceMax !== undefined && experienceMax !== null) {
    if (candidateExp <= experienceMax) {
      return 1;
    } else {
      return 0.8;
    }
  }

  // If no max is specified, anything >= min is within range
  return 1;
}

/**
 * Skill Match Logic:
 * overlap / requiredSkills
 */
export function calculateSkillScore(
  candidateSkills: string[],
  requiredSkills: string[]
): number {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 1; // If no specific skills required, default full match
  }

  if (!candidateSkills || candidateSkills.length === 0) {
    return 0;
  }

  const normalizedCandidate = new Set(
    candidateSkills.map((s) => s.trim().toLowerCase())
  );

  let overlap = 0;
  for (const req of requiredSkills) {
    const cleanReq = req.trim().toLowerCase();
    // Check direct equality or substring inclusion (e.g. 'react' matches 'react.js')
    if (
      normalizedCandidate.has(cleanReq) ||
      Array.from(normalizedCandidate).some(
        (cand) => cand.includes(cleanReq) || cleanReq.includes(cand)
      )
    ) {
      overlap++;
    }
  }

  const score = overlap / requiredSkills.length;
  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
}

/**
 * Location Match Logic:
 * Remote -> 1
 * Onsite mismatch -> 0.5
 * Exact match -> 1
 */
export function calculateLocationScore(
  candidateLocation: string,
  jobLocation?: string | null
): number {
  if (!jobLocation) {
    return 1;
  }

  const normCandidate = (candidateLocation || "").trim().toLowerCase();
  const normJob = jobLocation.trim().toLowerCase();

  // If job is Remote or candidate is Remote
  if (normJob.includes("remote") || normCandidate.includes("remote")) {
    return 1;
  }

  // Exact match (or city contains city)
  if (
    normCandidate === normJob ||
    (normCandidate.length > 2 && normJob.includes(normCandidate)) ||
    (normJob.length > 2 && normCandidate.includes(normJob))
  ) {
    return 1;
  }

  // Onsite mismatch
  return 0.5;
}

/**
 * Final Score Formula (MANDATORY)
 * FinalScore = (0.5 * skillMatchScore) + (0.3 * experienceMatchScore) + (0.2 * locationMatchScore)
 */
export function calculateFinalScore(
  skillMatchScore: number,
  experienceMatchScore: number,
  locationMatchScore: number
): DeterministicScoreResult {
  const finalScore = Number(
    (
      0.5 * skillMatchScore +
      0.3 * experienceMatchScore +
      0.2 * locationMatchScore
    ).toFixed(4)
  );

  return {
    skillMatchScore: Number(skillMatchScore.toFixed(4)),
    experienceMatchScore: Number(experienceMatchScore.toFixed(4)),
    locationMatchScore: Number(locationMatchScore.toFixed(4)),
    finalScore: Math.min(1, Math.max(0, finalScore)),
  };
}
