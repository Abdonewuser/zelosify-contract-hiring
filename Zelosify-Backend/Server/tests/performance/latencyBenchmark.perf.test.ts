import { describe, it, expect, vi } from "vitest";
import { AgentOrchestrator } from "../../src/services/ai/agentOrchestrator.js";
import type { OpeningContext, ProfileContext } from "../../src/services/ai/types.js";

describe("Performance & Latency Benchmark (100 Profiles)", () => {
  it("processes 100 profiles and verifies strict SLA: P95 latency < 2000ms, max < 1500ms target", async () => {
    const orchestrator = new AgentOrchestrator();

    const opening: OpeningContext = {
      id: "perf-opening-100",
      title: "Senior Full Stack Engineer",
      description: "TypeScript, Node.js, React, PostgreSQL, Docker, AWS. 5 to 8 years experience.",
      location: "Remote",
      experienceMin: 5,
      experienceMax: 8,
      requiredSkills: ["typescript", "react", "node", "postgresql", "aws"],
    };

    const latencies: number[] = [];
    const TOTAL_PROFILES = 100;

    console.log(`🚀 Starting performance simulation for ${TOTAL_PROFILES} profiles...`);

    // Run batch of profiles
    for (let i = 1; i <= TOTAL_PROFILES; i++) {
      const profile: ProfileContext = {
        id: 1000 + i,
        openingId: "perf-opening-100",
        s3Key: `tenant-wayne/perf-opening-100/candidate_${i}.pdf`,
        uploadedBy: `vendor_${i % 5}`,
      };

      const start = Date.now();
      const result = await orchestrator.evaluateProfile(opening, profile);
      const elapsed = Date.now() - start;

      latencies.push(elapsed);
    }

    // Sort ascending to calculate percentiles
    latencies.sort((a, b) => a - b);

    const minLatency = latencies[0];
    const maxLatency = latencies[latencies.length - 1];
    const avgLatency =
      latencies.reduce((acc, curr) => acc + curr, 0) / latencies.length;

    const p50Index = Math.floor(TOTAL_PROFILES * 0.5);
    const p90Index = Math.floor(TOTAL_PROFILES * 0.9);
    const p95Index = Math.floor(TOTAL_PROFILES * 0.95);
    const p99Index = Math.floor(TOTAL_PROFILES * 0.99);

    const p50 = latencies[p50Index];
    const p90 = latencies[p90Index];
    const p95 = latencies[p95Index];
    const p99 = latencies[p99Index];

    console.log("📊 [PERFORMANCE BENCHMARK RESULTS]:", {
      totalProfiles: TOTAL_PROFILES,
      minLatencyMs: minLatency,
      maxLatencyMs: maxLatency,
      avgLatencyMs: Number(avgLatency.toFixed(2)),
      p50Ms: p50,
      p90Ms: p90,
      p95Ms: p95,
      p99Ms: p99,
    });

    // STRICT SLA ASSERTIONS
    // 1. P95 latency must be strictly under 2000ms
    expect(p95).toBeLessThan(2000);

    // 2. Average latency must be under 1500ms
    expect(avgLatency).toBeLessThan(1500);

    // 3. Every single evaluation latency must be within reasonable bound
    expect(maxLatency).toBeLessThan(2000);
  }, 60000); // 60s timeout for 100 profiles
});
