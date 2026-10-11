import { Router } from "express";
import { requireContractRole } from "../../middlewares/auth/contractRbacMiddleware.js";
import {
  getHiringManagerOpenings,
  getHiringManagerOpeningProfiles,
  shortlistProfile,
  rejectProfile,
  previewHiringManagerProfile,
} from "../../controllers/hiring/hiringManagerContractController.js";

const router = Router();

// Apply strict HIRING_MANAGER RBAC to all contract routes
router.use(requireContractRole("HIRING_MANAGER"));

/**
 * 1. Fetch Openings (own openings only)
 * GET /openings
 */
router.get("/openings", getHiringManagerOpenings);

/**
 * 2. Fetch Profiles for Opening (must own opening)
 * GET /openings/:id/profiles
 */
router.get("/openings/:id/profiles", getHiringManagerOpeningProfiles);

/**
 * 3. Shortlist Profile
 * POST /profiles/:id/shortlist
 */
router.post("/profiles/:id/shortlist", shortlistProfile);

/**
 * 4. Reject Profile
 * POST /profiles/:id/reject
 */
router.post("/profiles/:id/reject", rejectProfile);

/**
 * 5. Preview Profile File
 * GET /profiles/:id/preview
 */
router.get("/profiles/:id/preview", previewHiringManagerProfile);

export default router;
