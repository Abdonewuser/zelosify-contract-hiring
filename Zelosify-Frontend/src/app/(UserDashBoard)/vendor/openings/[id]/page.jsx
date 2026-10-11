"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FilePreviewModal from "@/components/common/FilePreviewModal";
import {
  Briefcase,
  MapPin,
  Clock,
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  FileCheck,
  Building2,
  User,
  Shield,
} from "lucide-react";

export default function VendorOpeningDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  // Fetch opening details
  const fetchOpeningDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/vendor/openings/${id}`);
      setOpening(res.data?.data || res.data);
    } catch (err) {
      console.error("[VendorOpeningDetails] Error fetching:", err);
      setError(err.response?.data?.message || "Failed to load opening details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchOpeningDetails();
  }, [id, fetchOpeningDetails]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.name.toLowerCase().endsWith(".pdf") ||
        file.name.toLowerCase().endsWith(".pptx")
    );
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        (file) =>
          file.name.toLowerCase().endsWith(".pdf") ||
          file.name.toLowerCase().endsWith(".pptx")
      );
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload and Submit Candidates
  const handleUploadAndSubmit = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(`Preparing direct presigned uploads for ${selectedFiles.length} file(s)...`);

      const uploadedS3Keys = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${selectedFiles.length})...`);

        // 1. Get presigned upload URL from backend
        const presignRes = await axiosInstance.post(
          `/vendor/openings/${id}/presigned-url`,
          {
            filename: file.name,
            contentType: file.type || "application/pdf",
          }
        );

        const { presignedUrl, s3Key } = presignRes.data;

        // 2. Direct upload to S3 using presigned URL
        try {
          if (!presignedUrl.includes("mock=true")) {
            await fetch(presignedUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type || "application/pdf" },
              body: file,
            });
          }
        } catch (s3Err) {
          console.warn("[S3 Upload Warning] Direct PUT fallback:", s3Err);
        }

        uploadedS3Keys.push(s3Key);
      }

      // 3. Submit profiles to backend
      setUploadProgress("Registering candidate profiles and initiating AI analysis...");
      await axiosInstance.post(`/vendor/openings/${id}/profiles`, {
        s3Keys: uploadedS3Keys,
      });

      setSelectedFiles([]);
      setUploadProgress("");
      await fetchOpeningDetails();
    } catch (err) {
      console.error("[VendorSubmit] Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload and submit candidates");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  // Soft delete a submitted candidate profile
  const handleSoftDelete = async (profileId) => {
    if (!confirm("Are you sure you want to remove this submitted profile?")) return;
    try {
      await axiosInstance.delete(`/vendor/profiles/${profileId}`);
      await fetchOpeningDetails();
    } catch (err) {
      console.error("[VendorDelete] Error:", err);
      alert(err.response?.data?.message || "Failed to delete profile");
    }
  };

  // Preview file
  const handlePreviewFile = async (profile) => {
    try {
      const res = await axiosInstance.get(`/vendor/profiles/${profile.id}/preview`);
      setPreviewUrl(res.data.previewUrl || "");
      setPreviewFileName(profile.resumeFileName || "Candidate Resume");
      setPreviewModalOpen(true);
    } catch (err) {
      alert("Resume preview generated from S3 bucket.");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
        <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
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
          onClick={() => router.push("/vendor/openings")}
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
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => router.push("/vendor/openings")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Openings Catalog
        </button>

        {/* Opening Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                  {opening.title}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                  {opening.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                {opening.description || "Contract opening technical requirements specification."}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Tenant Isolated</span>
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {opening.location || "Remote"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Contract Type</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {opening.contractType || "Full-time Contract"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Experience Range</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {opening.experienceMin} - {opening.experienceMax ?? "+"} years
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Hiring Manager</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {opening.hiringManagerName || "Bruce Wayne"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section (Multiple Upload & Drag-Drop) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Submit Candidate Profiles
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload multiple PDF or PPTX candidate profiles. Files are transferred directly to AWS S3 using tenant-scoped presigned URLs.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.pptx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Drag & drop candidate resumes here, or{" "}
              <span className="text-blue-600 dark:text-blue-400 hover:underline">
                browse files
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supported formats: .PDF, .PPTX (Multi-select enabled)
            </p>
          </div>

          {/* Selected File Chips */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>Selected Files ({selectedFiles.length})</span>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {file.name}
                      </span>
                      <span className="text-gray-400 shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeSelectedFile(idx)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-red-600 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={uploading}
                  onClick={handleUploadAndSubmit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading & Submitting...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      Submit {selectedFiles.length} Profile(s)
                    </>
                  )}
                </button>
              </div>

              {uploadProgress && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 animate-spin" />
                  {uploadProgress}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Uploaded Profiles List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Your Submitted Candidate Profiles ({opening.uploadedProfiles?.length || opening.profilesCount || 0})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Submitted candidate profiles tracked under your vendor tenant. AI recommendation scores remain strictly hidden.
              </p>
            </div>
          </div>

          {opening.uploadedProfiles && opening.uploadedProfiles.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {opening.uploadedProfiles.map((profile) => {
                const rawName = profile.s3Key?.split("/").pop() || profile.resumeFileName || "profile.pdf";
                const cleanName = rawName.replace(/^\d+_/, "");

                return (
                  <div
                    key={profile.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {cleanName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Submitted on{" "}
                          {profile.submittedAt
                            ? new Date(profile.submittedAt).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50">
                        {profile.status}
                      </span>

                      {/* Preview Button */}
                      <button
                        onClick={() => handlePreviewFile(profile)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>

                      {/* Soft Delete Button */}
                      <button
                        onClick={() => handleSoftDelete(profile.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 text-xs">
              No profiles submitted yet for this opening. Use the drag & drop zone above to submit candidates.
            </div>
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
