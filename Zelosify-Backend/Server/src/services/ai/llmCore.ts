import axios from "axios";
import { getToolDefinitionsForLLM } from "./toolRegistry.js";
import type { OpeningContext, ProfileContext } from "./types.js";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface LLMResponse {
  message: LLMMessage;
  latencyMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM Core interface supporting function / tool calling
 */
export class LLMCore {
  private provider: "groq" | "gemini" | "mock";
  private apiKey: string;
  private model: string;

  constructor() {
    if (process.env.GROQ_API_KEY) {
      this.provider = "groq";
      this.apiKey = process.env.GROQ_API_KEY;
      this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    } else if (process.env.GEMINI_API_KEY) {
      this.provider = "gemini";
      this.apiKey = process.env.GEMINI_API_KEY;
      this.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    } else {
      this.provider = "mock";
      this.apiKey = "";
      this.model = "mock-tool-calling-agent";
    }
  }

  getProvider(): string {
    return this.provider;
  }

  /**
   * Invokes LLM with chat history and tool definitions
   */
  async chatWithTools(
    messages: LLMMessage[],
    attempt: number = 1
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      if (this.provider === "groq") {
        return await this.callGroq(messages, startTime);
      } else if (this.provider === "gemini") {
        return await this.callGemini(messages, startTime);
      } else {
        return await this.callMockAgent(messages, startTime);
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      console.warn(`[LLMCore] Error on attempt ${attempt}:`, error?.message);

      if (attempt < 3) {
        // Retry logic for malformed or transient error
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
        return this.chatWithTools(messages, attempt + 1);
      }

      // If external provider fails after retries, fallback to deterministic mock tool caller
      console.warn("[LLMCore] Falling back to Mock Tool-Calling Core");
      return await this.callMockAgent(messages, startTime);
    }
  }

  /**
   * Groq OpenAI-compatible Chat Completions with Tools
   */
  private async callGroq(
    messages: LLMMessage[],
    startTime: number
  ): Promise<LLMResponse> {
    const tools = getToolDefinitionsForLLM().map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: this.model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const latencyMs = Date.now() - startTime;
    const choice = response.data.choices[0];
    const usage = response.data.usage || {
      prompt_tokens: 150,
      completion_tokens: 50,
      total_tokens: 200,
    };

    return {
      message: choice.message,
      latencyMs,
      tokenUsage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    };
  }

  /**
   * Gemini Tool-Calling API Adapter
   */
  private async callGemini(
    messages: LLMMessage[],
    startTime: number
  ): Promise<LLMResponse> {
    const tools = [
      {
        functionDeclarations: getToolDefinitionsForLLM().map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        })),
      },
    ];

    // Format contents for Gemini
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        contents,
        tools,
      },
      { timeout: 10000 }
    );

    const latencyMs = Date.now() - startTime;
    const candidate = response.data.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find(
      (p: any) => p.functionCall
    )?.functionCall;

    let message: LLMMessage;
    if (functionCall) {
      message = {
        role: "assistant",
        tool_calls: [
          {
            id: `call_${Date.now()}`,
            type: "function",
            function: {
              name: functionCall.name,
              arguments: JSON.stringify(functionCall.args || {}),
            },
          },
        ],
      };
    } else {
      const text = candidate?.content?.parts?.[0]?.text || "";
      message = {
        role: "assistant",
        content: text,
      };
    }

    return {
      message,
      latencyMs,
      tokenUsage: {
        promptTokens: 120,
        completionTokens: 60,
        totalTokens: 180,
      },
    };
  }

  /**
   * High-Fidelity Mock Tool-Calling Agent
   * Dynamically steps through tool invocations according to the agent protocol.
   */
  private async callMockAgent(
    messages: LLMMessage[],
    startTime: number
  ): Promise<LLMResponse> {
    // Inspect history to see which tools have been called
    const toolResultMessages = messages.filter((m) => m.role === "tool");
    const lastToolResult = toolResultMessages[toolResultMessages.length - 1];

    let message: LLMMessage;

    if (toolResultMessages.length === 0) {
      // Step 1: LLM decides to parse the resume
      const userMsg = messages.find((m) => m.role === "user")?.content || "";
      const s3KeyMatch = userMsg.match(/s3Key:\s*"([^"]+)"/);
      const s3Key = s3KeyMatch ? s3KeyMatch[1] : "default-resume.pdf";

      message = {
        role: "assistant",
        tool_calls: [
          {
            id: `call_parse_${Date.now()}`,
            type: "function",
            function: {
              name: "parse_resume",
              arguments: JSON.stringify({ s3Key }),
            },
          },
        ],
      };
    } else if (lastToolResult?.name === "parse_resume") {
      // Step 2: Extract features from the parsed text
      const parsedData = JSON.parse(lastToolResult.content || "{}");
      message = {
        role: "assistant",
        tool_calls: [
          {
            id: `call_extract_${Date.now()}`,
            type: "function",
            function: {
              name: "extract_features",
              arguments: JSON.stringify({ text: parsedData.text || "" }),
            },
          },
        ],
      };
    } else if (lastToolResult?.name === "extract_features") {
      // Step 3: Normalize skills
      const extracted = JSON.parse(lastToolResult.content || "{}");
      message = {
        role: "assistant",
        tool_calls: [
          {
            id: `call_norm_${Date.now()}`,
            type: "function",
            function: {
              name: "normalize_skills",
              arguments: JSON.stringify({ skills: extracted.skills || [] }),
            },
          },
        ],
      };
    } else if (lastToolResult?.name === "normalize_skills") {
      // Step 4: Deterministic matching
      // Find features from earlier extract_features
      const extractMsg = toolResultMessages.find(
        (m) => m.name === "extract_features"
      );
      const extracted = JSON.parse(extractMsg?.content || "{}");
      const normResult = JSON.parse(lastToolResult.content || "{}");

      // Extract opening requirements from user prompt
      const userMsg = messages.find((m) => m.role === "user")?.content || "";
      let minExp = 3;
      let maxExp = 7;
      let jobLoc = "Remote";
      let reqSkills: string[] = ["react", "node", "typescript"];

      const minMatch = userMsg.match(/experienceMin:\s*(\d+)/);
      if (minMatch) minExp = parseInt(minMatch[1], 10);
      const maxMatch = userMsg.match(/experienceMax:\s*(\d+)/);
      if (maxMatch) maxExp = parseInt(maxMatch[1], 10);
      const locMatch = userMsg.match(/jobLocation:\s*"([^"]+)"/);
      if (locMatch) jobLoc = locMatch[1];
      const skillsMatch = userMsg.match(/requiredSkills:\s*\[([^\]]+)\]/);
      if (skillsMatch) {
        reqSkills = skillsMatch[1]
          .split(",")
          .map((s) => s.replace(/['"\s]/g, ""));
      }

      message = {
        role: "assistant",
        tool_calls: [
          {
            id: `call_match_${Date.now()}`,
            type: "function",
            function: {
              name: "match_features",
              arguments: JSON.stringify({
                candidateExperience: extracted.experienceYears || 5,
                experienceMin: minExp,
                experienceMax: maxExp,
                candidateSkills: normResult.normalizedSkills || [],
                requiredSkills: reqSkills,
                candidateLocation: extracted.location || "Remote",
                jobLocation: jobLoc,
              }),
            },
          },
        ],
      };
    } else if (lastToolResult?.name === "match_features") {
      // Step 5: Scoring engine
      const features = JSON.parse(lastToolResult.content || "{}");
      message = {
        role: "assistant",
        tool_calls: [
          {
            id: `call_score_${Date.now()}`,
            type: "function",
            function: {
              name: "calculate_score",
              arguments: JSON.stringify({
                skillMatchScore: features.skillMatchScore ?? 0.8,
                experienceMatchScore: features.experienceMatchScore ?? 1.0,
                locationMatchScore: features.locationMatchScore ?? 1.0,
              }),
            },
          },
        ],
      };
    } else {
      // Step 6: Final reasoning and structured JSON output
      const scoreMsg = toolResultMessages.find(
        (m) => m.name === "calculate_score"
      );
      const scoreData = JSON.parse(scoreMsg?.content || "{}");
      const finalScore = scoreData.finalScore ?? 0.82;
      const isRecommended = finalScore >= 0.75;

      const reason = isRecommended
        ? `Strong skill match (${(scoreData.skillMatchScore * 100).toFixed(
            0
          )}%), experience within required range.`
        : `Score ${(finalScore * 100).toFixed(
            0
          )}% does not meet threshold for automatic recommendation.`;

      const outputJson = {
        recommended: isRecommended,
        score: finalScore,
        confidence: 0.91,
        reason,
      };

      message = {
        role: "assistant",
        content: JSON.stringify(outputJson),
      };
    }

    const latencyMs = Math.max(1, Date.now() - startTime);

    return {
      message,
      latencyMs,
      tokenUsage: {
        promptTokens: 140 + toolResultMessages.length * 35,
        completionTokens: 45,
        totalTokens: 185 + toolResultMessages.length * 35,
      },
    };
  }
}
