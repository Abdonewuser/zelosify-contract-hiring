import { Router } from "express";
import { requireContractRole } from "../../middlewares/auth/contractRbacMiddleware.js";
import {
  getVendorOpenings,
  getVendorOpeningDetails,
  presignProfileUploadUrl,
  submitProfiles,
  softDeleteVendorProfile,
  previewVendorProfile,
} from "../../controllers/vendor/itVendorController.js";

const router = Router();

// Apply strict IT_VENDOR RBAC to all contract routes
router.use(requireContractRole("IT_VENDOR"));

/**
 * 1. Fetch Openings
 * GET /openings
 */
router.get("/openings", getVendorOpenings);

/**
 * 2. Fetch Opening Details
 * GET /openings/:id
 */
router.get("/openings/:id", getVendorOpeningDetails);

/**
 * 3. Presign Upload URLs
 * POST /openings/:id/profiles/presign
 */
router.post("/openings/:id/profiles/presign", presignProfileUploadUrl);

/**
 * 4. Submit Profiles
 * POST /openings/:id/profiles/upload
 */
router.post("/openings/:id/profiles/upload", submitProfiles);

/**
 * 5. Soft Delete Profile
 * DELETE /profiles/:id
 */
router.delete("/profiles/:id", softDeleteVendorProfile);

/**
 * 6. File Preview
 * GET /profiles/:id/preview
 */
router.get("/profiles/:id/preview", previewVendorProfile);

export default router;
