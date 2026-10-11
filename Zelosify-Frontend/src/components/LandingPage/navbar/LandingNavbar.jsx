"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Bot, ChevronRight } from "lucide-react";
import MobileMenu from "../MobileMenu";

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
        >
          <nav className="bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 rounded-2xl px-6 py-3 w-full max-w-5xl">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/assets/logos/zelosify_Dark.png"
                  alt="Zelosify"
                  className="h-8 w-auto"
                />
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <Link
                  href="/vendor/openings"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Vendor Portal
                </Link>
                <Link
                  href="/hiring-manager/openings"
                  className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-slate-400" />
                  Hiring Manager & AI
                </Link>
                <a
                  href="#features"
                  className="hover:text-slate-900 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#architecture"
                  className="hover:text-slate-900 transition-colors"
                >
                  Architecture
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/vendor/openings"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all"
                >
                  Launch App
                  <ChevronRight className="w-4 h-4" />
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Toggle Menu"
                >
                  <svg
                    className="w-5 h-5 text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
        </motion.div>
      </AnimatePresence>

      {/* Mobile Menu */}
      <MobileMenu
        isMenuOpen={isMenuOpen}
        closeMenu={() => setIsMenuOpen(false)}
      />
    </>
  );
}
