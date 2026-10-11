import express from "express";
import vendorRequestRoutes from "./vendorRequestRoutes.js";
import itVendorContractRoutes from "./itVendorContractRoutes.js";

const router = express.Router();

/**
 * @route /vendor/requests
 */
router.use("/requests", vendorRequestRoutes);

/**
 * IT Vendor Contract Management endpoints:
 * /vendor/openings
 * /vendor/openings/:id
 * /vendor/openings/:id/profiles/presign
 * /vendor/openings/:id/profiles/upload
 * /vendor/profiles/:id
 */
router.use("/", itVendorContractRoutes);

export default router;
