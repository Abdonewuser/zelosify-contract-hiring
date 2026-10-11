"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

export default function HiringManagerOpeningsPage() {
  const router = useRouter();
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOpenings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/hiring-manager/openings");
      if (res.data?.openings) {
        setOpenings(res.data.openings);
      }
    } catch (err) {
      console.error("[HiringManagerOpenings] Error fetching openings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenings();
  }, [fetchOpenings]);

  const filteredOpenings = openings.filter((op) =>
    search
      ? op.title?.toLowerCase().includes(search.toLowerCase()) ||
        op.location?.toLowerCase().includes(search.toLowerCase()) ||
        op.contractType?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              AI Decision Support
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Your Contract Openings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your contract openings and review candidates evaluated by the AI Recommendation Agent.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter openings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Openings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-800 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded w-32" />
                <div className="h-16 bg-gray-50 dark:bg-gray-800/20 rounded-xl" />
              </div>
            ))
          ) : filteredOpenings.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                No openings found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You do not currently manage any active contract openings in this tenant.
              </p>
            </div>
          ) : (
            filteredOpenings.map((op) => (
              <div
                key={op.id}
                onClick={() => router.push(`/hiring-manager/openings/${op.id}`)}
                className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/50 cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {op.title}
                    </h3>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 shrink-0">
                      {op.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {op.description || "Contract opening specification."}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {op.location || "Remote"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {op.experienceMin}-{op.experienceMax ?? "+"} yrs
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>{op.profilesCount || 0} Profiles</span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    Review Profiles
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
