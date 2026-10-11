import Ajv from "ajv";
import type {
  ParsedResumeSchema,
  FeatureVector,
  DeterministicScoreResult,
  AgentDecisionOutput,
} from "./types.js";

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

// Schema for Resume Parsing Tool Output
export const parsedResumeJsonSchema = {
  type: "object",
  properties: {
    experienceYears: { type: "number", minimum: 0 },
    skills: {
      type: "array",
      items: { type: "string" },
    },
    normalizedSkills: {
      type: "array",
      items: { type: "string" },
    },
    location: { type: "string" },
    education: {
      type: "array",
      items: { type: "string" },
    },
    keywords: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "experienceYears",
    "skills",
    "normalizedSkills",
    "location",
    "education",
    "keywords",
  ],
  additionalProperties: true,
};

// Schema for Feature Vector
export const featureVectorJsonSchema = {
  type: "object",
  properties: {
    experienceYears: { type: "number", minimum: 0 },
    skills: {
      type: "array",
      items: { type: "string" },
    },
    location: { type: "string" },
    skillMatchScore: { type: "number", minimum: 0, maximum: 1 },
    experienceMatchScore: { type: "number", minimum: 0, maximum: 1 },
    locationMatchScore: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "experienceYears",
    "skills",
    "location",
    "skillMatchScore",
    "experienceMatchScore",
    "locationMatchScore",
  ],
  additionalProperties: true,
};

// Schema for Deterministic Scoring Result
export const scoringResultJsonSchema = {
  type: "object",
  properties: {
    skillMatchScore: { type: "number", minimum: 0, maximum: 1 },
    experienceMatchScore: { type: "number", minimum: 0, maximum: 1 },
    locationMatchScore: { type: "number", minimum: 0, maximum: 1 },
    finalScore: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "skillMatchScore",
    "experienceMatchScore",
    "locationMatchScore",
    "finalScore",
  ],
  additionalProperties: true,
};

// Schema for Agent Final Output
export const agentOutputJsonSchema = {
  type: "object",
  properties: {
    recommended: { type: "boolean" },
    score: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string", minLength: 5 },
  },
  required: ["recommended", "score", "confidence", "reason"],
  additionalProperties: false,
};

const validateParsedResume = ajv.compile(parsedResumeJsonSchema);
const validateFeatureVector = ajv.compile(featureVectorJsonSchema);
const validateScoringResult = ajv.compile(scoringResultJsonSchema);
const validateAgentOutput = ajv.compile(agentOutputJsonSchema);

export class SchemaValidationError extends Error {
  errors: any[];
  constructor(message: string, errors: any[] = []) {
    super(message);
    this.name = "SchemaValidationError";
    this.errors = errors;
  }
}

export function validateParsedResumeOutput(data: any): ParsedResumeSchema {
  const valid = validateParsedResume(data);
  if (!valid) {
    throw new SchemaValidationError(
      "Invalid Parsed Resume output schema: " + ajv.errorsText(validateParsedResume.errors),
      validateParsedResume.errors || []
    );
  }
  return data as unknown as ParsedResumeSchema;
}

export function validateFeatureVectorOutput(data: any): FeatureVector {
  const valid = validateFeatureVector(data);
  if (!valid) {
    throw new SchemaValidationError(
      "Invalid Feature Vector schema: " + ajv.errorsText(validateFeatureVector.errors),
      validateFeatureVector.errors || []
    );
  }
  return data as unknown as FeatureVector;
}

export function validateScoringResultOutput(data: any): DeterministicScoreResult {
  const valid = validateScoringResult(data);
  if (!valid) {
    throw new SchemaValidationError(
      "Invalid Scoring Result schema: " + ajv.errorsText(validateScoringResult.errors),
      validateScoringResult.errors || []
    );
  }
  return data as unknown as DeterministicScoreResult;
}

export function validateAgentDecisionOutput(data: any): AgentDecisionOutput {
  const valid = validateAgentOutput(data);
  if (!valid) {
    throw new SchemaValidationError(
      "Invalid Agent Output schema: " + ajv.errorsText(validateAgentOutput.errors),
      validateAgentOutput.errors || []
    );
  }
  return data as unknown as AgentDecisionOutput;
}
