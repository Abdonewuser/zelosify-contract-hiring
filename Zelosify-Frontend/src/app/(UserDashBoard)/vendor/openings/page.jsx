"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import {
  Briefcase,
  MapPin,
  Calendar,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function VendorOpeningsPage() {
  const router = useRouter();
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 8;

  const fetchOpenings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/vendor/openings?page=${page}&limit=${limit}`);
      if (res.data?.data) {
        setOpenings(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("[VendorOpenings] Error fetching openings:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOpenings();
  }, [fetchOpenings]);

  const filteredOpenings = openings.filter((op) =>
    search
      ? op.title?.toLowerCase().includes(search.toLowerCase()) ||
        op.location?.toLowerCase().includes(search.toLowerCase()) ||
        op.contractType?.toLowerCase().includes(search.toLowerCase()) ||
        op.hiringManagerName?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
              <Briefcase className="h-3.5 w-3.5" />
              IT Vendor Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Contract Openings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Explore available contract openings, view requirements, and submit candidate profiles.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Table / Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/60 dark:bg-gray-900/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Contract Type</th>
                  <th className="py-4 px-6">Posted Date</th>
                  <th className="py-4 px-6">Hiring Manager Name</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-1.5" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-28" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredOpenings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No contract openings found.
                    </td>
                  </tr>
                ) : (
                  filteredOpenings.map((opening) => (
                    <tr
                      key={opening.id}
                      onClick={() => router.push(`/vendor/openings/${opening.id}`)}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {opening.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Experience: {opening.experienceMin} - {opening.experienceMax ?? "+"} years
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {opening.location || "Remote"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50">
                          {opening.contractType || "Full-time Contract"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {opening.postedDate
                            ? new Date(opening.postedDate).toLocaleDateString()
                            : "Recently"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {opening.hiringManagerName || "Hiring Manager"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/vendor/openings/${opening.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 text-gray-700 dark:text-gray-200 transition-all shadow-sm"
                        >
                          View Details
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
