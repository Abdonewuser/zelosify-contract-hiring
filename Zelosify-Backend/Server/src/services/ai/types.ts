/**
 * AI Recommendation Agent Type Definitions
 * Adheres strictly to Round_One_Task.pdf requirements
 */

export interface ParsedResumeSchema {
  experienceYears: number;
  skills: string[];
  normalizedSkills: string[];
  location: string;
  education: string[];
  keywords: string[];
}

export interface FeatureVector {
  experienceYears: number;
  skills: string[];
  location: string;
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
}

export interface DeterministicScoreResult {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
}

export interface AgentDecisionOutput {
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
}

export interface AgentObservabilityLog {
  profileId: number;
  openingId: string;
  startTime: string;
  endTime: string;
  parsingTimeMs: number;
  matchingTimeMs: number;
  totalLatencyMs: number;
  finalScore: number;
  recommended: boolean;
  confidence: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolsInvoked: string[];
  retriesCount: number;
  errors: string[];
}

export interface OpeningContext {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  contractType?: string | null;
  experienceMin: number;
  experienceMax?: number | null;
  requiredSkills?: string[];
}

export interface ProfileContext {
  id: number;
  openingId: string;
  s3Key: string;
  uploadedBy: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context?: any) => Promise<any>;
}
