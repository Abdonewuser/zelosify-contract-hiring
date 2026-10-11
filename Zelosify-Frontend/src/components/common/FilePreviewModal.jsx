"use client";
import React from "react";
import { X, ExternalLink, Download, FileText } from "lucide-react";

export default function FilePreviewModal({ isOpen, onClose, previewUrl, fileName }) {
  if (!isOpen) return null;

  const isPdf = fileName?.toLowerCase().endsWith(".pdf") || previewUrl?.includes(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate max-w-md">
                {fileName || "Candidate Resume Preview"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure backend preview link
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Open in new tab / Download"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-2 overflow-hidden flex items-center justify-center">
          {previewUrl ? (
            isPdf ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full rounded-lg border-0 shadow-inner"
                title="Resume Preview"
              />
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Presentation File (PPTX)
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                  PPTX files cannot be previewed in an inline iframe. Please download the file to view.
                </p>
                <a
                  href={previewUrl}
                  download={fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </a>
              </div>
            )
          ) : (
            <div className="text-center text-gray-500">Preview link is unavailable.</div>
          )}
        </div>
      </div>
    </div>
  );
}
