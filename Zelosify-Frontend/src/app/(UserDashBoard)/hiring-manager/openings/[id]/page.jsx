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

  // File preview
  const handlePreview = async (profile) => {
    try {
      const res = await axiosInstance.get(`/hiring-manager/profiles/${profile.id}/preview`);
      setPreviewUrl(res.data.previewUrl);
      setPreviewFileName(profile.fileName || "resume.pdf");
      setPreviewModalOpen(true);
    } catch (err) {
      console.error("[Preview] Error getting preview URL:", err);
      alert("Unable to generate preview link");
    }
  };

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch = search
        ? p.fileName?.toLowerCase().includes(search.toLowerCase()) ||
          p.explanation?.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesBadge =
        filterBadge === "ALL"
          ? true
          : p.recommendationBadge === filterBadge;

      return matchesSearch && matchesBadge;
    });
  }, [profiles, search, filterBadge]);

  // Virtualization metrics
  const ITEM_HEIGHT = 220; // approximate height per candidate card
  const CONTAINER_HEIGHT = 700;
  const isVirtualized = filteredProfiles.length > 50;

  const handleScroll = (e) => {
    if (isVirtualized) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };

  const { visibleItems, paddingTop, paddingBottom } = useMemo(() => {
    if (!isVirtualized) {
      return { visibleItems: filteredProfiles, paddingTop: 0, paddingBottom: 0 };
    }
    const totalCount = filteredProfiles.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
    const endIndex = Math.min(
      totalCount,
      Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + 2
    );

    const items = filteredProfiles.slice(startIndex, endIndex);
    const top = startIndex * ITEM_HEIGHT;
    const bottom = Math.max(0, (totalCount - endIndex) * ITEM_HEIGHT);

    return { visibleItems: items, paddingTop: top, paddingBottom: bottom };
  }, [filteredProfiles, scrollTop, isVirtualized]);

  if (loading && !opening) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-96" />
        <div className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
        <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  if (error || !opening) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {error || "Opening not found"}
        </h2>
        <p className="text-sm text-gray-500">
          You can only view profiles for openings you manage within this tenant.
        </p>
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Openings
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Navigation */}
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Openings
        </button>

        {/* Opening Details Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Assisted Candidate Filtering
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {opening.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl leading-relaxed">
                {opening.description || "Contract opening requirements specification."}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {profiles.length}
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Candidates Evaluated
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
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
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
              Filter:
            </span>
            {[
              { id: "ALL", label: `All (${profiles.length})` },
              {
                id: "RECOMMENDED",
                label: `🟢 Recommended (${
                  profiles.filter((p) => p.recommendationBadge === "RECOMMENDED").length
                })`,
              },
              {
                id: "BORDERLINE",
                label: `🟡 Borderline (${
                  profiles.filter((p) => p.recommendationBadge === "BORDERLINE").length
                })`,
              },
              {
                id: "NOT_RECOMMENDED",
                label: `🔴 Not Recommended (${
                  profiles.filter((p) => p.recommendationBadge === "NOT_RECOMMENDED").length
                })`,
              },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterBadge(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  filterBadge === btn.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search candidate or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-4 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Profiles List / Virtualized Container */}
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

              return (
                <div
                  key={profile.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border transition-all duration-200 shadow-sm hover:shadow-md ${
                    isShortlisted
                      ? "border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-400/10"
                      : isRejected
                      ? "border-red-200 dark:border-red-900/50 opacity-75"
                      : "border-gray-200/80 dark:border-gray-800"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Candidate & Recommendation Details */}
                    <div className="space-y-3.5 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                            {profile.fileName || "Candidate Profile"}
                          </h3>
                          <p className="text-xs text-gray-400">
                            Uploaded on{" "}
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
                      <div className="bg-gray-50/70 dark:bg-gray-850/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mb-1 text-xs">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          AI Agent Explanation:
                        </span>
                        {profile.explanation ||
                          "Evaluation pending or completed without explanatory notes."}
                      </div>

                      {/* Telemetry Chips (Score, Confidence, Latency) */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400 font-normal">Score:</span>
                          <span
                            className={
                              profile.score >= 75
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : profile.score >= 50
                                ? "text-amber-600 dark:text-amber-400 font-bold"
                                : "text-rose-600 dark:text-rose-400 font-bold"
                            }
                          >
                            {profile.score !== null ? `${profile.score}%` : "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400 font-normal">Confidence:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {profile.confidence !== null ? `${profile.confidence}%` : "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-gray-400">
                          <Gauge className="h-3.5 w-3.5" />
                          <span>Processing time: {profile.latencyMs ? `${profile.latencyMs}ms` : "<1500ms"}</span>
                        </div>

                        {profile.status !== "SUBMITTED" && (
                          <div className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Status: {profile.status}
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
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          isShortlisted
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 border border-emerald-200/60 dark:border-emerald-800/60"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isShortlisted ? "Shortlisted" : "Shortlist"}
                      </button>

                      {/* Reject Button */}
                      <button
                        disabled={isRejected || actionLoadingId === profile.id}
                        onClick={() => handleReject(profile.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                          isRejected
                            ? "bg-rose-600 text-white cursor-default"
                            : "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 border border-rose-200/60 dark:border-rose-800/60"
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

          {isVirtualized && paddingBottom > 0 && (
            <div style={{ height: `${paddingBottom}px` }} />
          )}
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
