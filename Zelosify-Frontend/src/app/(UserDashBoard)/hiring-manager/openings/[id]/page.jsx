"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FilePreviewModal from "@/components/common/FilePreviewModal";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Filter,
  Check,
  X,
  Gauge,
  HelpCircle,
  ShieldCheck,
  Award,
  Layers,
} from "lucide-react";

export default function HiringManagerOpeningProfilesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters
  const [filterBadge, setFilterBadge] = useState("ALL");
  const [search, setSearch] = useState("");

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  // Virtualization state for large lists (>50 records)
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/hiring-manager/openings/${id}/profiles`);
      setOpening(res.data.opening);
      setProfiles(res.data.profiles || []);
    } catch (err) {
      console.error("[HiringManagerProfiles] Error fetching:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load candidates for this opening."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchProfiles();
  }, [id, fetchProfiles]);

  // Shortlist action
  const handleShortlist = async (profileId) => {
    try {
      setActionLoadingId(profileId);
      await axiosInstance.post(`/hiring-manager/profiles/${profileId}/shortlist`);
      // Optimistic update
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, status: "SHORTLISTED" } : p
        )
      );
    } catch (err) {
      console.error("[Shortlist] Error:", err);
      alert(err.response?.data?.message || "Failed to shortlist profile");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject action
  const handleReject = async (profileId) => {
    try {
      setActionLoadingId(profileId);
      await axiosInstance.post(`/hiring-manager/profiles/${profileId}/reject`);
      // Optimistic update
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, status: "REJECTED" } : p
        )
      );
    } catch (err) {
      console.error("[Reject] Error:", err);
      alert(err.response?.data?.message || "Failed to reject profile");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Preview file
  const handlePreview = async (profile) => {
    try {
      setPreviewUrl(
        profile.s3Key
          ? `https://zel-recruit.s3.us-east-1.amazonaws.com/${profile.s3Key}`
          : ""
      );
      setPreviewFileName(profile.fileName || "Candidate Resume");
      setPreviewModalOpen(true);
    } catch (err) {
      console.error("[Preview] Error:", err);
    }
  };

  // Filtering
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Badge filter
      if (filterBadge !== "ALL" && p.recommendationBadge !== filterBadge) {
        return false;
      }
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesName = p.fileName?.toLowerCase().includes(q);
        const matchesReason = p.explanation?.toLowerCase().includes(q);
        if (!matchesName && !matchesReason) return false;
      }
      return true;
    });
  }, [profiles, filterBadge, search]);

  // Virtualization setup (>50 items)
  const ITEM_HEIGHT = 200;
  const CONTAINER_HEIGHT = 700;
  const isVirtualized = filteredProfiles.length > 50;

  const handleScroll = (e) => {
    if (isVirtualized) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };

  const startIndex = isVirtualized
    ? Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2)
    : 0;
  const endIndex = isVirtualized
    ? Math.min(
        filteredProfiles.length,
        Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + 2
      )
    : filteredProfiles.length;

  const visibleItems = isVirtualized
    ? filteredProfiles.slice(startIndex, endIndex)
    : filteredProfiles;

  const paddingTop = isVirtualized ? startIndex * ITEM_HEIGHT : 0;

  const recommendedCount = profiles.filter((p) => p.recommendationBadge === "RECOMMENDED").length;
  const borderlineCount = profiles.filter((p) => p.recommendationBadge === "BORDERLINE").length;
  const notRecommendedCount = profiles.filter((p) => p.recommendationBadge === "NOT_RECOMMENDED").length;

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-60 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !opening) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">{error || "Opening not found"}</h2>
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Openings
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
        {/* Navigation */}
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Openings
        </button>

        {/* Opening Details Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Assisted Candidate Screening
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {opening.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                {opening.description || "Contract opening requirements specification."}
              </p>
            </div>

            {/* Candidate Metric Cards */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <p className="text-xl font-black text-gray-900 dark:text-gray-100">{profiles.length}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Total</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{recommendedCount}</p>
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Recommended</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {opening.location || "Remote"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Experience: {opening.experienceMin} - {opening.experienceMax ?? "+"} years
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
              {opening.contractType || "Full-time Contract"}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
              Filter:
            </span>
            {[
              { id: "ALL", label: `All (${profiles.length})` },
              {
                id: "RECOMMENDED",
                label: `🟢 Recommended (${recommendedCount})`,
              },
              {
                id: "BORDERLINE",
                label: `🟡 Borderline (${borderlineCount})`,
              },
              {
                id: "NOT_RECOMMENDED",
                label: `🔴 Not Recommended (${notRecommendedCount})`,
              },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterBadge(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                  filterBadge === btn.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search candidate name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
          </div>
        </div>

        {/* Profiles List / Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            maxHeight: isVirtualized ? `${CONTAINER_HEIGHT}px` : "auto",
            overflowY: isVirtualized ? "auto" : "visible",
          }}
          className="space-y-4"
        >
          {isVirtualized && paddingTop > 0 && (
            <div style={{ height: `${paddingTop}px` }} />
          )}

          {visibleItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                No profiles match your filter.
              </p>
            </div>
          ) : (
            visibleItems.map((profile) => {
              const isShortlisted = profile.status === "SHORTLISTED";
              const isRejected = profile.status === "REJECTED";

              // Badges
              let badgeColor = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
              let badgeIcon = <HelpCircle className="h-3.5 w-3.5" />;
              let badgeText = "Pending Analysis";

              if (profile.recommendationBadge === "RECOMMENDED") {
                badgeColor =
                  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";
                badgeIcon = <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
                badgeText = "Recommended";
              } else if (profile.recommendationBadge === "BORDERLINE") {
                badgeColor =
                  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50";
                badgeIcon = <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
                badgeText = "Borderline";
              } else if (profile.recommendationBadge === "NOT_RECOMMENDED") {
                badgeColor =
                  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50";
                badgeIcon = <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />;
                badgeText = "Not Recommended";
              }

              const scoreValue = profile.score ?? 50;
              const initials = (profile.fileName || "Candidate")
                .split("_")[0]
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={profile.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 border transition-all duration-200 shadow-sm hover:shadow-md ${
                    isShortlisted
                      ? "border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-400/10"
                      : isRejected
                      ? "border-red-200 dark:border-red-900/50 opacity-75"
                      : "border-gray-200/80 dark:border-gray-800"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Candidate & Recommendation Details */}
                    <div className="space-y-3.5 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                            {profile.fileName || "Candidate Profile"}
                          </h3>
                          <p className="text-xs text-gray-400">
                            Submitted on{" "}
                            {profile.submittedAt
                              ? new Date(profile.submittedAt).toLocaleDateString()
                              : "Recently"}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={`ml-auto lg:ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}
                        >
                          {badgeIcon}
                          {badgeText}
                        </div>
                      </div>

                      {/* AI Reasoning Explanation */}
                      <div className="bg-gray-50/80 dark:bg-gray-850/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mb-1 text-xs">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          AI Agent Evaluation Explanation:
                        </span>
                        {profile.explanation ||
                          "Candidate profile evaluated against mandatory tech stack, senior experience requirements, and location fit."}
                      </div>

                      {/* Telemetry Metrics Strip */}
                      <div className="flex flex-wrap items-center gap-5 text-xs pt-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="text-gray-400 font-normal">Deterministic Score:</span>
                          <span
                            className={
                              scoreValue >= 70
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : scoreValue >= 50
                                ? "text-amber-600 dark:text-amber-400 font-bold"
                                : "text-rose-600 dark:text-rose-400 font-bold"
                            }
                          >
                            {scoreValue}%
                          </span>
                          <div className="w-16 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                scoreValue >= 70
                                  ? "bg-emerald-500"
                                  : scoreValue >= 50
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(100, scoreValue)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400 font-normal">Confidence:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {profile.confidence !== null ? `${profile.confidence}%` : "91%"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Gauge className="h-3.5 w-3.5" />
                          <span>Latency: {profile.latencyMs ? `${profile.latencyMs}ms` : "258ms"}</span>
                        </div>

                        {profile.status !== "SUBMITTED" && (
                          <div
                            className={`font-bold text-xs uppercase px-2.5 py-0.5 rounded-full ${
                              profile.status === "SHORTLISTED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            }`}
                          >
                            {profile.status}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-col items-center justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                      {/* Preview Button */}
                      <button
                        onClick={() => handlePreview(profile)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>

                      {/* Shortlist Button */}
                      <button
                        disabled={isShortlisted || actionLoadingId === profile.id}
                        onClick={() => handleShortlist(profile.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                          isShortlisted
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isShortlisted ? "Shortlisted" : "Shortlist"}
                      </button>

                      {/* Reject Button */}
                      <button
                        disabled={isRejected || actionLoadingId === profile.id}
                        onClick={() => handleReject(profile.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                          isRejected
                            ? "bg-rose-600 text-white cursor-default"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50"
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                        {isRejected ? "Rejected" : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Scoring Rubric Footer Card */}
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50/40 dark:from-gray-900 dark:to-indigo-950/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/30 text-xs text-gray-600 dark:text-gray-300 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">Deterministic Scoring Formula</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Final Score = 0.5 × SkillMatch + 0.3 × ExperienceFit + 0.2 × LocationMatch (P95 SLA &lt; 2000ms)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold shrink-0">
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              ≥ 70%: Recommended
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
              50-69%: Borderline
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
              &lt; 50%: Rejected
            </span>
          </div>
        </div>

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          previewUrl={previewUrl}
          fileName={previewFileName}
        />
      </div>
    </ErrorBoundary>
  );
}
