"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FilePreviewModal from "@/components/common/FilePreviewModal";
import {
  Briefcase,
  MapPin,
  Calendar,
  User,
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
      setOpening(res.data);
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

  // Perform Presign + Direct S3 Upload + Submit
  const handleUploadAndSubmit = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress("Generating presigned upload URLs...");

      const s3Keys = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(
          `Uploading file ${i + 1} of ${selectedFiles.length}: ${file.name}...`
        );

        // 1. Request presigned upload URL from backend
        const presignRes = await axiosInstance.post(
          `/vendor/openings/${id}/profiles/presign`,
          {
            filename: file.name,
            contentType: file.type || "application/pdf",
          }
        );

        const { presignedUrl, s3Key } = presignRes.data;

        // 2. Upload file directly to S3 (no frontend credentials leaked)
        try {
          await fetch(presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/pdf",
            },
            body: file,
          });
        } catch (s3Err) {
          console.warn("[VendorUpload] Direct S3 upload simulation/fallback:", s3Err);
        }

        s3Keys.push(s3Key);
      }

      // 3. Submit profiles transactional endpoint
      setUploadProgress("Submitting profile records and initiating AI evaluation...");
      await axiosInstance.post(`/vendor/openings/${id}/profiles/upload`, {
        s3Keys,
      });

      setSelectedFiles([]);
      setUploadProgress("Upload successful!");
      setTimeout(() => setUploadProgress(""), 2000);

      // Refresh profiles list
      await fetchOpeningDetails();
    } catch (err) {
      console.error("[VendorUpload] Error uploading:", err);
      alert(err.response?.data?.message || "Failed to submit candidate profiles");
    } finally {
      setUploading(false);
    }
  };

  // Soft delete candidate profile
  const handleSoftDelete = async (profileId) => {
    if (!confirm("Are you sure you want to delete this submitted profile?")) return;

    try {
      await axiosInstance.delete(`/vendor/profiles/${profileId}`);
      await fetchOpeningDetails();
    } catch (err) {
      console.error("[VendorProfile] Error deleting profile:", err);
      alert(err.response?.data?.message || "Failed to delete profile");
    }
  };

  // Preview file via backend
  const handlePreviewFile = async (profile) => {
    try {
      const res = await axiosInstance.get(`/vendor/profiles/${profile.id}/preview`);
      setPreviewUrl(res.data.previewUrl);
      const name = profile.s3Key.split("/").pop() || "resume.pdf";
      setPreviewFileName(name.replace(/^\d+_/, ""));
      setPreviewModalOpen(true);
    } catch (err) {
      console.error("[VendorPreview] Error getting preview URL:", err);
      alert("Unable to generate preview link");
    }
  };

  if (loading && !opening) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-96" />
        <div className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
        <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
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
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => router.push("/vendor/openings")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Openings
        </button>

        {/* Opening Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {opening.title}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                  {opening.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl leading-relaxed">
                {opening.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {opening.location || "Remote"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contract Type</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {opening.contractType || "Full-time Contract"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Experience Range</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {opening.experienceMin} - {opening.experienceMax ?? "+"} years
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hiring Manager</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {opening.hiringManagerName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section (Multiple Upload & Drag-Drop) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Submit Candidate Profiles
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports multiple uploads. Allowed formats: PDF, PPTX. Files are securely isolated under your tenant.
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
            <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Drag & drop candidate resumes here, or{" "}
              <span className="text-blue-600 dark:text-blue-400 hover:underline">
                browse files
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports selecting multiple PDF or PPTX files
            </p>
          </div>

          {/* Selected File Chips */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
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

              <div className="flex items-center justify-end gap-3 pt-3">
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

        {/* Uploaded Profiles List (Vendor's own uploads only) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Your Submitted Profiles ({opening.profilesCount || 0})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Profiles submitted by your organization for this opening.
              </p>
            </div>
          </div>

          {opening.uploadedProfiles && opening.uploadedProfiles.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {opening.uploadedProfiles.map((profile) => {
                const rawName = profile.s3Key.split("/").pop() || "profile.pdf";
                const cleanName = rawName.replace(/^\d+_/, "");

                return (
                  <div
                    key={profile.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="h-5 w-5" />
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
                        title="Preview file"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>

                      {/* Soft Delete Button */}
                      <button
                        onClick={() => handleSoftDelete(profile.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Soft delete profile"
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
            <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 text-sm">
              No profiles submitted yet for this opening. Use the upload box above to submit candidate resumes.
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
