import { describe, it, expect } from "vitest";
import {
  calculateExperienceScore,
  calculateSkillScore,
  calculateLocationScore,
  calculateFinalScore,
} from "../../src/services/ai/scoringEngine.js";
import { evaluateDecisionPolicy } from "../../src/services/ai/decisionPolicy.js";

describe("Deterministic Scoring Engine & Decision Policy", () => {
  describe("Experience boundary tests", () => {
    it("returns 0 if candidateExp < min", () => {
      expect(calculateExperienceScore(2, 5, 8)).toBe(0);
      expect(calculateExperienceScore(0, 3, 5)).toBe(0);
      expect(calculateExperienceScore(4.9, 5, 10)).toBe(0);
    });

    it("returns 1 if candidateExp is within range [min, max]", () => {
      expect(calculateExperienceScore(5, 5, 8)).toBe(1);
      expect(calculateExperienceScore(6.5, 5, 8)).toBe(1);
      expect(calculateExperienceScore(8, 5, 8)).toBe(1);
    });

    it("returns 0.8 if candidateExp > max", () => {
      expect(calculateExperienceScore(9, 5, 8)).toBe(0.8);
      expect(calculateExperienceScore(15, 5, 8)).toBe(0.8);
    });

    it("handles unbounded max (null/undefined): returns 1 when candidateExp >= min", () => {
      expect(calculateExperienceScore(5, 5, null)).toBe(1);
      expect(calculateExperienceScore(10, 5, null)).toBe(1);
      expect(calculateExperienceScore(3, 5, null)).toBe(0);
    });
  });

  describe("Skill overlap accuracy tests", () => {
    it("returns 1.0 when candidate has all required skills", () => {
      const candidateSkills = ["TypeScript", "React", "Node.js", "Docker"];
      const requiredSkills = ["typescript", "react", "node.js"];
      expect(calculateSkillScore(candidateSkills, requiredSkills)).toBe(1);
    });

    it("returns partial ratio accurately based on overlap / requiredSkills", () => {
      const candidateSkills = ["React", "CSS"];
      const requiredSkills = ["React", "Node", "PostgreSQL", "AWS"];
      // 1 match out of 4 = 0.25
      expect(calculateSkillScore(candidateSkills, requiredSkills)).toBe(0.25);

      const candidateSkills2 = ["React", "Node", "MongoDB"];
      // 2 matches out of 4 = 0.5
      expect(calculateSkillScore(candidateSkills2, requiredSkills)).toBe(0.5);
    });

    it("returns 0 when candidate has no matching skills", () => {
      const candidateSkills = ["PHP", "Laravel"];
      const requiredSkills = ["React", "TypeScript", "Node"];
      expect(calculateSkillScore(candidateSkills, requiredSkills)).toBe(0);
    });

    it("handles empty candidate skills gracefully", () => {
      expect(calculateSkillScore([], ["React", "Node"])).toBe(0);
    });

    it("defaults to 1 if no required skills are specified for opening", () => {
      expect(calculateSkillScore(["React"], [])).toBe(1);
    });
  });

  describe("Location logic tests", () => {
    it("returns 1 when opening location is Remote", () => {
      expect(calculateLocationScore("New York, NY", "Remote")).toBe(1);
      expect(calculateLocationScore("Gotham City", "Remote")).toBe(1);
    });

    it("returns 1 when candidate location is Remote", () => {
      expect(calculateLocationScore("Remote", "San Francisco, CA")).toBe(1);
    });

    it("returns 1 on exact location match", () => {
      expect(calculateLocationScore("New York, NY", "New York, NY")).toBe(1);
      expect(calculateLocationScore("Gotham City", "Gotham City")).toBe(1);
    });

    it("returns 0.5 on onsite mismatch", () => {
      expect(calculateLocationScore("Chicago, IL", "New York, NY")).toBe(0.5);
      expect(calculateLocationScore("San Francisco, CA", "Gotham City")).toBe(0.5);
    });
  });

  describe("Score formula correctness: (0.5 * skill) + (0.3 * exp) + (0.2 * loc)", () => {
    it("calculates perfect match correctly as 1.0", () => {
      const result = calculateFinalScore(1.0, 1.0, 1.0);
      expect(result.finalScore).toBe(1.0);
      expect(result.skillMatchScore).toBe(1.0);
      expect(result.experienceMatchScore).toBe(1.0);
      expect(result.locationMatchScore).toBe(1.0);
    });

    it("calculates 0 match correctly as 0.0", () => {
      const result = calculateFinalScore(0.0, 0.0, 0.0);
      expect(result.finalScore).toBe(0.0);
    });

    it("calculates weighted scores with mathematical precision", () => {
      // 0.5 * 0.8 + 0.3 * 1.0 + 0.2 * 1.0 = 0.40 + 0.30 + 0.20 = 0.90
      const res1 = calculateFinalScore(0.8, 1.0, 1.0);
      expect(res1.finalScore).toBe(0.9);

      // 0.5 * 0.6 + 0.3 * 0.8 + 0.2 * 0.5 = 0.30 + 0.24 + 0.10 = 0.64
      const res2 = calculateFinalScore(0.6, 0.8, 0.5);
      expect(res2.finalScore).toBe(0.64);
    });
  });

  describe("Decision thresholds policy", () => {
    it("classifies score >= 0.75 as RECOMMENDED (recommended: true)", () => {
      const scoringResult = calculateFinalScore(0.8, 1.0, 1.0); // 0.90
      const policy = evaluateDecisionPolicy(scoringResult);
      expect(policy.category).toBe("RECOMMENDED");
      expect(policy.recommended).toBe(true);
      expect(policy.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it("classifies score between 0.5 and 0.74 as BORDERLINE (recommended: false)", () => {
      const scoringResult = calculateFinalScore(0.6, 0.8, 0.5); // 0.64
      const policy = evaluateDecisionPolicy(scoringResult);
      expect(policy.category).toBe("BORDERLINE");
      expect(policy.recommended).toBe(false);
    });

    it("classifies score < 0.5 as NOT_RECOMMENDED (recommended: false)", () => {
      const scoringResult = calculateFinalScore(0.2, 0.0, 0.5); // 0.10 + 0 + 0.10 = 0.20
      const policy = evaluateDecisionPolicy(scoringResult);
      expect(policy.category).toBe("NOT_RECOMMENDED");
      expect(policy.recommended).toBe(false);
    });
  });
});
