"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const MobileMenu = ({ isMenuOpen, closeMenu }) => {
  const menuVariants = {
    closed: { x: "100%", opacity: 0 },
    open: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const linkVariants = {
    closed: { y: 20, opacity: 0 },
    open: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      initial="closed"
      animate={isMenuOpen ? "open" : "closed"}
      variants={menuVariants}
      className="md:hidden fixed inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col items-stretch justify-start p-6 overflow-y-auto z-50"
    >
      <div className="flex justify-end mb-8">
        <button
          onClick={closeMenu}
          className="p-2 rounded-full bg-gray-200/50 hover:bg-gray-300/50 transition-colors duration-300"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col space-y-4 my-auto">
        <Link
          href="/vendor/openings"
          onClick={closeMenu}
          className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-white/80"
        >
          Vendor Portal (Requisitions & S3 Upload)
        </Link>
        <Link
          href="/hiring-manager/openings"
          onClick={closeMenu}
          className="text-lg font-semibold text-slate-800 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-white/80"
        >
          Hiring Manager (Autonomous AI Screening)
        </Link>
        <Link
          href="/hiring-manager/openings/op-1"
          onClick={closeMenu}
          className="text-lg font-semibold text-slate-800 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-white/80"
        >
          Live AI Evaluation (Opening OP-1)
        </Link>
      </div>

      <motion.div
        variants={linkVariants}
        transition={{ delay: 0.2 }}
        className="mt-auto pt-6 border-t border-slate-200/80 space-y-3"
      >
        <Link
          href="/vendor/openings"
          className="block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-center shadow hover:shadow-md transition-all"
          onClick={closeMenu}
        >
          Launch Platform
        </Link>
        <Link
          href="/login"
          className="block px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl text-center hover:bg-white transition-all"
          onClick={closeMenu}
        >
          Sign In
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default MobileMenu;
