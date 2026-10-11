import { describe, it, expect, vi } from "vitest";
import { AgentOrchestrator } from "../../src/services/ai/agentOrchestrator.js";
import {
  validateParsedResumeOutput,
  validateFeatureVectorOutput,
  validateScoringResultOutput,
  validateAgentDecisionOutput,
  SchemaValidationError,
} from "../../src/services/ai/schemaValidator.js";
import { TOOL_REGISTRY } from "../../src/services/ai/toolRegistry.js";
import type { OpeningContext, ProfileContext } from "../../src/services/ai/types.js";

describe("AI Recommendation Agent Orchestration & Tool Calling Unit Tests", () => {
  describe("Schema Validation Layer (Ajv)", () => {
    it("validates compliant parsed resume schema", () => {
      const validData = {
        experienceYears: 5,
        skills: ["React", "Node.js"],
        normalizedSkills: ["react", "node"],
        location: "Remote",
        education: ["B.S. in Computer Science"],
        keywords: ["react", "node", "remote"],
      };
      const result = validateParsedResumeOutput(validData);
      expect(result.experienceYears).toBe(5);
    });

    it("throws SchemaValidationError on missing required fields in parsed resume", () => {
      const invalidData = {
        experienceYears: 5,
        // missing skills, normalizedSkills, location, education, keywords
      };
      expect(() => validateParsedResumeOutput(invalidData)).toThrowError(
        SchemaValidationError
      );
    });

    it("validates compliant feature vector schema", () => {
      const validVector = {
        experienceYears: 6,
        skills: ["TypeScript", "PostgreSQL"],
        location: "Gotham City",
        skillMatchScore: 0.85,
        experienceMatchScore: 1.0,
        locationMatchScore: 1.0,
      };
      const result = validateFeatureVectorOutput(validVector);
      expect(result.skillMatchScore).toBe(0.85);
    });

    it("throws SchemaValidationError if scores are out of [0, 1] range in feature vector", () => {
      const invalidVector = {
        experienceYears: 6,
        skills: ["TypeScript"],
        location: "Gotham City",
        skillMatchScore: 1.5, // Invalid > 1
        experienceMatchScore: 1.0,
        locationMatchScore: 1.0,
      };
      expect(() => validateFeatureVectorOutput(invalidVector)).toThrowError(
        SchemaValidationError
      );
    });

    it("validates compliant agent final decision output", () => {
      const validDecision = {
        recommended: true,
        score: 0.88,
        confidence: 0.94,
        reason: "Candidate has strong overlap in required stack with extensive experience.",
      };
      const result = validateAgentDecisionOutput(validDecision);
      expect(result.recommended).toBe(true);
      expect(result.score).toBe(0.88);
    });

    it("throws SchemaValidationError on malformed decision output", () => {
      const invalidDecision = {
        recommended: "yes", // should be boolean
        score: 0.88,
      };
      expect(() => validateAgentDecisionOutput(invalidDecision)).toThrowError(
        SchemaValidationError
      );
    });
  });

  describe("Tool Registry Execution", () => {
    it("has all 5 mandatory tools registered", () => {
      expect(TOOL_REGISTRY["parse_resume"]).toBeDefined();
      expect(TOOL_REGISTRY["extract_features"]).toBeDefined();
      expect(TOOL_REGISTRY["normalize_skills"]).toBeDefined();
      expect(TOOL_REGISTRY["match_features"]).toBeDefined();
      expect(TOOL_REGISTRY["calculate_score"]).toBeDefined();
    });

    it("executes skill normalization tool accurately", async () => {
      const result = await TOOL_REGISTRY["normalize_skills"].execute({
        skills: ["ReactJS", "Node.js", "K8s", "Postgres", "AWS S3"],
      });
      expect(result.normalizedSkills).toContain("react");
      expect(result.normalizedSkills).toContain("node");
      expect(result.normalizedSkills).toContain("kubernetes");
      expect(result.normalizedSkills).toContain("postgresql");
    });

    it("executes scoring engine tool with deterministic formula", async () => {
      const result = await TOOL_REGISTRY["calculate_score"].execute({
        skillMatchScore: 0.8,
        experienceMatchScore: 1.0,
        locationMatchScore: 0.5,
      });
      // 0.5 * 0.8 + 0.3 * 1.0 + 0.2 * 0.5 = 0.4 + 0.3 + 0.1 = 0.8
      expect(result.finalScore).toBe(0.8);
    });
  });

  describe("Multi-turn Agent Orchestration & Observability", () => {
    it("successfully completes multi-step tool-calling evaluation and produces structured observability logs", async () => {
      const orchestrator = new AgentOrchestrator();

      const opening: OpeningContext = {
        id: "opening-dev-1",
        title: "Senior Full Stack Engineer",
        description: "Requires TypeScript, React, Node.js, and PostgreSQL with 5-8 years experience.",
        location: "Remote",
        experienceMin: 5,
        experienceMax: 8,
        requiredSkills: ["typescript", "react", "node", "postgresql"],
      };

      const profile: ProfileContext = {
        id: 501,
        openingId: "opening-dev-1",
        s3Key: "tenant-1/opening-dev-1/1700000000_john_doe_resume.pdf",
        uploadedBy: "vendor-user-1",
      };

      const result = await orchestrator.evaluateProfile(opening, profile);

      // Verify decision output schema
      expect(result.decision).toBeDefined();
      expect(typeof result.decision.recommended).toBe("boolean");
      expect(typeof result.decision.score).toBe("number");
      expect(result.decision.score).toBeGreaterThanOrEqual(0);
      expect(result.decision.score).toBeLessThanOrEqual(1);
      expect(result.decision.reason.length).toBeGreaterThan(10);

      // Verify observability telemetry
      expect(result.observability).toBeDefined();
      expect(result.observability.profileId).toBe(501);
      expect(result.observability.openingId).toBe("opening-dev-1");
      expect(result.observability.toolsInvoked.length).toBeGreaterThan(0);
      expect(result.observability.toolsInvoked).toContain("parse_resume");
      expect(result.observability.toolsInvoked).toContain("calculate_score");
      expect(result.observability.tokenUsage.totalTokens).toBeGreaterThan(0);
      expect(result.observability.totalLatencyMs).toBeGreaterThan(0);

      // Verify reasoning steps
      expect(result.reasoningSteps.length).toBeGreaterThan(0);
    });
  });
});
