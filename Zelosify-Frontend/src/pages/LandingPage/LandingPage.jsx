"use client";

import Link from "next/link";
import LandingNavbar from "@/components/LandingPage/navbar/LandingNavbar";
import {
  Briefcase,
  Bot,
  ShieldCheck,
  Zap,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Cpu,
  BarChart3,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Floating Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-slate-50 border-b border-slate-200/60">
        {/* Subtle Background Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-400/15 to-indigo-500/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-12 left-10 w-72 h-72 bg-purple-400/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide shadow-xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Autonomous AI Screening • Strict Multi-Tenant RBAC</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Next-Generation <span className="text-blue-600">Contract Hiring</span>
            <br className="hidden sm:inline" />{" "}
            Powered by <span className="text-indigo-600">Autonomous AI</span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Streamline enterprise vendor staffing with tenant-scoped presigned S3 ingestion, 5-tool LLM candidate screening, and deterministic sub-second rubric scoring.
          </p>

          {/* Dual Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vendor/openings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <Briefcase className="w-5 h-5" />
              <span>Explore Vendor Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/hiring-manager/openings/op-1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-base shadow-2xs hover:border-slate-400 transition-all duration-200"
            >
              <Bot className="w-5 h-5 text-indigo-600" />
              <span>Review AI Screening Live</span>
            </Link>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Evaluation Latency</div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                253 ms <span className="text-xs font-normal text-emerald-600">(P95)</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">SLA Target &lt; 2,000ms</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Autonomous Tools</div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-500" />
                5 Registered
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Ajv Schema Validated</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Scoring Rubric</div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Deterministic
              </div>
              <div className="text-xs text-slate-400 mt-0.5">0.5 Skill + 0.3 Exp + 0.2 Loc</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Multi-Tenant RBAC</div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                100% Isolated
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Keycloak &amp; Presigned S3</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Portal Showcase Preview */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Two Tailored Portals. One Unified Platform.
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Engineered with strict role boundaries ensuring IT Vendors and Hiring Managers experience focused, isolated workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Vendor Portal Card */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs mb-5">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold tracking-wider text-blue-700 uppercase bg-blue-100/80 px-2 py-0.5 rounded">
                    IT Vendor Role
                  </span>
                  <span className="text-xs text-slate-500">• Requisitions &amp; S3 Upload</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Vendor Portal &amp; S3 Ingestion
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Browse open client requisitions from enterprise partners like Bruce Wayne Corp. Upload resumes directly to AWS S3 using presigned URLs without exposing confidential client candidate scores.
                </p>

                <div className="space-y-2.5 text-sm text-slate-700 bg-white/80 rounded-xl p-4 border border-slate-200/60 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time opening catalog with experience &amp; budget criteria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Multi-file drag-and-drop S3 upload (.pdf, .pptx)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Private candidate submission tracking (scores hidden)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/vendor/openings"
                className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors group"
              >
                <span>Launch Vendor Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Hiring Manager Portal Card */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs mb-5">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold tracking-wider text-indigo-700 uppercase bg-indigo-100/80 px-2 py-0.5 rounded">
                    Hiring Manager Role
                  </span>
                  <span className="text-xs text-slate-500">• AI Screening &amp; Shortlisting</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Autonomous Candidate Screening
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Access autonomous screening intelligence. The 5-tool agent extracts candidate features, matches skills against requirement ontologies, and scores profiles using the deterministic formula.
                </p>

                <div className="space-y-2.5 text-sm text-slate-700 bg-white/80 rounded-xl p-4 border border-slate-200/60 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Explainable AI justifications and confidence scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Priya Sharma (95%), Alex Morgan (88%) real-time evaluations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>One-click Candidate Shortlist &amp; Rejection workflow</span>
                  </div>
                </div>
              </div>

              <Link
                href="/hiring-manager/openings/op-1"
                className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors group"
              >
                <span>Launch Hiring Manager AI View</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section id="features" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Core Capabilities</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Enterprise-Grade AI &amp; Multi-Tenant Architecture
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Engineered according to rigorous production assessment standards with zero latency compromises.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">5 Autonomous Tools</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registered tools for resume parsing, feature extraction, skill normalization, rubric matching, and scoring with Ajv validation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Deterministic Rubric</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                0.5 Skill + 0.3 Experience + 0.2 Location formula guarantees reproducible, auditable, and unbiased hiring recommendations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tenant-scoped data schemas ensure strict confidentiality. Vendors can never access client evaluations or competing submissions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Direct S3 Presigning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct-to-cloud AWS S3 presigned URL ingestion eliminates backend memory bottlenecks when handling heavy resume payloads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Formula Deep Dive */}
      <section id="architecture" className="py-16 md:py-24 bg-white border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4">
                <Layers className="w-3.5 h-3.5" />
                <span>Deterministic Scoring Engine</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                Auditable, Mathematical Recommendation Rubric
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                Eliminates LLM hallucinations and scoring drift. Every candidate profile evaluated by the agent passes through an auditable mathematical function with full observability logging.
              </p>

              {/* Formula Badge Box */}
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 mb-8">
                <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-2">Standard Formula Specification</div>
                <div className="font-mono text-base sm:text-lg text-emerald-400 font-bold">
                  Final Score = (0.50 × SkillMatch) + (0.30 × ExperienceFit) + (0.20 × LocationMatch)
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> &ge; 70%: Recommended</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 50% - 69%: Borderline</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> &lt; 50%: Rejected</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/hiring-manager/openings/op-1"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
                >
                  <span>View Live Candidate Evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/Abdonewuser/zelosify-contract-hiring"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Zelosify</span>
            <span>• Contract Hiring &amp; Autonomous AI Screening Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/vendor/openings" className="hover:text-white transition-colors">
              Vendor Portal
            </Link>
            <Link href="/hiring-manager/openings" className="hover:text-white transition-colors">
              Hiring Manager
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <a
              href="https://github.com/Abdonewuser/zelosify-contract-hiring"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
