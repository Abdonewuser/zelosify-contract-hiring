import prisma from "../../config/prisma/prisma.js";
import { AgentOrchestrator } from "./agentOrchestrator.js";
import type {
  OpeningContext,
  ProfileContext,
  AgentObservabilityLog,
} from "./types.js";

export const RECOMMENDATION_ENGINE_VERSION = "v1.2.0-agentic";

export interface RecommendationRunResult {
  profileId: number;
  openingId: string;
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
  latencyMs: number;
  version: string;
  observability: AgentObservabilityLog;
}

export class RecommendationService {
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.orchestrator = new AgentOrchestrator();
  }

  /**
   * Evaluates a profile and persists recommendations inside a Prisma transaction
   * Provides idempotent re-run support
   */
  async processProfileRecommendation(
    profileId: number
  ): Promise<RecommendationRunResult> {
    const startTime = Date.now();

    // 1. Fetch profile and opening data
    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    if (!profile.opening) {
      throw new Error(`Opening associated with profile ${profileId} not found`);
    }

    // Extract skills keywords from opening title & description
    const rawSkills = this.extractOpeningSkills(
      profile.opening.title,
      profile.opening.description
    );

    const openingContext: OpeningContext = {
      id: profile.opening.id,
      title: profile.opening.title,
      description: profile.opening.description,
      location: profile.opening.location,
      contractType: profile.opening.contractType,
      experienceMin: profile.opening.experienceMin,
      experienceMax: profile.opening.experienceMax,
      requiredSkills: rawSkills,
    };

    const profileContext: ProfileContext = {
      id: profile.id,
      openingId: profile.openingId,
      s3Key: profile.s3Key,
      uploadedBy: profile.uploadedBy,
    };

    // 2. Run agent orchestrator
    const orchestration = await this.orchestrator.evaluateProfile(
      openingContext,
      profileContext
    );

    const latencyMs = Date.now() - startTime;
    const now = new Date();

    // 3. Persist recommendation in Prisma transaction (ACID guarantee)
    await prisma.$transaction(async (tx) => {
      await tx.hiringProfile.update({
        where: { id: profileId },
        data: {
          recommended: orchestration.decision.recommended,
          recommendationScore: orchestration.decision.score,
          recommendationConfidence: orchestration.decision.confidence,
          recommendationReason: orchestration.decision.reason,
          recommendationLatencyMs: latencyMs,
          recommendationVersion: RECOMMENDATION_ENGINE_VERSION,
          recommendedAt: now,
        },
      });
    });

    return {
      profileId: profile.id,
      openingId: profile.openingId,
      recommended: orchestration.decision.recommended,
      score: orchestration.decision.score,
      confidence: orchestration.decision.confidence,
      reason: orchestration.decision.reason,
      latencyMs,
      version: RECOMMENDATION_ENGINE_VERSION,
      observability: orchestration.observability,
    };
  }

  /**
   * Async trigger for profile recommendations
   * Ensures API is non-blocking (<2s) while processing profiles in background
   */
  triggerAsyncProfileRecommendation(profileId: number): void {
    setImmediate(async () => {
      try {
        console.log(`[RecommendationService] Running async agent evaluation for profile ${profileId}...`);
        const result = await this.processProfileRecommendation(profileId);
        console.log(`[RecommendationService] Completed evaluation for profile ${profileId}:`, {
          recommended: result.recommended,
          score: result.score,
          latencyMs: result.latencyMs,
        });
      } catch (err) {
        console.error(`[RecommendationService] Async evaluation error for profile ${profileId}:`, err);
      }
    });
  }

  /**
   * Extracts required skill list from opening title & description
   */
  private extractOpeningSkills(
    title: string,
    description?: string | null
  ): string[] {
    const text = `${title} ${description || ""}`.toLowerCase();
    const catalog = [
      "typescript",
      "javascript",
      "react",
      "node",
      "postgresql",
      "aws",
      "docker",
      "kubernetes",
      "python",
      "graphql",
      "vitest",
      "terraform",
      "redis",
    ];

    const found: string[] = [];
    for (const skill of catalog) {
      if (text.includes(skill)) {
        found.push(skill);
      }
    }

    return found.length > 0 ? found : ["typescript", "react", "node"];
  }
}

export const recommendationServiceInstance = new RecommendationService();
