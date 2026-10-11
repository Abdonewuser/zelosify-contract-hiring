import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../types/typeIndex.js";
import prisma from "../../config/prisma/prisma.js";
import { createStorageService } from "../../services/storage/storageFactory.js";
import { recommendationServiceInstance } from "../../services/ai/recommendationService.js";
import { isPrismaConnected } from "../../utils/prisma/connectPrisma.js";
import { devMockStore } from "../../services/devMockStore.js";

const isDevFallback = () => !isPrismaConnected && process.env.VITEST !== "true";

/**
 * Controller for IT Vendor Contract Hiring Operations
 * Strictly enforces tenant isolation and RBAC constraints
 */

// Helper to sanitize profile outputs for IT_VENDOR (cannot view AI recommendations)
function sanitizeProfileForVendor(profile: any) {
  const {
    recommended,
    recommendationScore,
    recommendationReason,
    recommendationLatencyMs,
    recommendationVersion,
    recommendationConfidence,
    recommendedAt,
    ...vendorSafeProfile
  } = profile;
  return vendorSafeProfile;
}

/**
 * 1. Fetch Openings
 * GET /api/vendor/openings
 * - Tenant filtering mandatory
 * - Pagination required
 */
export async function getVendorOpenings(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const tenantId = user.tenant?.tenantId || (user as any).tenantId;

    if (!tenantId) {
      res.status(403).json({ message: "Tenant context is missing" });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    if (isDevFallback()) {
      const result = devMockStore.getOpenings({ page, limit, isVendor: true });
      res.json(result);
      return;
    }

    const [openings, total] = await Promise.all([
      prisma.opening.findMany({
        where: {
          tenantId,
          status: "OPEN",
        },
        skip,
        take: limit,
        orderBy: { postedDate: "desc" },
      }),
      prisma.opening.count({
        where: {
          tenantId,
          status: "OPEN",
        },
      }),
    ]);

    // Fetch hiring manager names
    const hiringManagerIds = Array.from(new Set(openings.map((o) => o.hiringManagerId)));
    const managers = await prisma.user.findMany({
      where: { id: { in: hiringManagerIds } },
      select: { id: true, firstName: true, lastName: true, username: true },
    });
    const managerMap = new Map(
      managers.map((m) => [
        m.id,
        [m.firstName, m.lastName].filter(Boolean).join(" ") || m.username || "Hiring Manager",
      ])
    );

    const enriched = openings.map((opening) => ({
      ...opening,
      hiringManagerName: managerMap.get(opening.hiringManagerId) || "Hiring Manager",
    }));

    res.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[VendorController] Error fetching openings:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 2. Fetch Opening Details
 * GET /api/vendor/openings/:id
 * Must include:
 * - Hiring Manager name
 * - Experience range
 * - Profiles count
 * - Uploaded profiles list (strictly only vendor's own uploads, AI fields stripped)
 */
export async function getVendorOpeningDetails(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const tenantId = user.tenant?.tenantId || (user as any).tenantId;
    const openingId = req.params.id;

    if (!tenantId) {
      res.status(403).json({ message: "Tenant context is missing" });
      return;
    }

    if (isDevFallback()) {
      const opening = devMockStore.getOpeningById(openingId, undefined, true);
      if (!opening) {
        res.status(404).json({ message: "Opening not found" });
        return;
      }
      res.json({
        id: opening.id,
        title: opening.title,
        description: opening.description,
        location: opening.location,
        contractType: opening.contractType,
        experienceMin: opening.experienceMin,
        experienceMax: opening.experienceMax,
        experienceRange: `${opening.experienceMin} - ${opening.experienceMax ?? "+"} years`,
        postedDate: opening.createdAt,
        status: opening.status,
        hiringManagerName: "Bruce Wayne",
        profilesCount: opening._count?.profiles || 0,
        uploadedProfiles: [],
      });
      return;
    }

    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId, // Mandatory tenant isolation
      },
      include: {
        hiringProfiles: {
          where: {
            uploadedBy: user.id, // Strictly vendor's own uploads
            isDeleted: false,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!opening) {
      res.status(404).json({ message: "Opening not found" });
      return;
    }

    // Lookup Hiring Manager name
    const hiringManager = await prisma.user.findUnique({
      where: { id: opening.hiringManagerId },
      select: { firstName: true, lastName: true, username: true },
    });
    const hiringManagerName = hiringManager
      ? [hiringManager.firstName, hiringManager.lastName].filter(Boolean).join(" ") || hiringManager.username
      : "Hiring Manager";

    // Strip AI recommendations from profiles (vendors cannot view AI recommendations)
    const sanitizedProfiles = opening.hiringProfiles.map(sanitizeProfileForVendor);

    res.json({
      id: opening.id,
      title: opening.title,
      description: opening.description,
      location: opening.location,
      contractType: opening.contractType,
      experienceMin: opening.experienceMin,
      experienceMax: opening.experienceMax,
      experienceRange: `${opening.experienceMin} - ${opening.experienceMax ?? "+"} years`,
      postedDate: opening.postedDate,
      status: opening.status,
      hiringManagerName,
      profilesCount: sanitizedProfiles.length,
      uploadedProfiles: sanitizedProfiles,
    });
  } catch (error: any) {
    console.error("[VendorController] Error fetching opening details:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 3. Presign Upload URLs
 * POST /api/vendor/openings/:id/profiles/presign
 * Stored under: <bucket>/<tenantId>/<openingId>/<timestamp>_<filename>
 * Direct S3 upload url without leaking AWS secrets to client
 */
export async function presignProfileUploadUrl(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const tenantId = user.tenant?.tenantId || (user as any).tenantId;
    const openingId = req.params.id;
    const { filename, contentType } = req.body;

    if (!filename) {
      res.status(400).json({ message: "Filename is required" });
      return;
    }

    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `${tenantId}/${openingId}/${timestamp}_${sanitizedFilename}`;

    if (isDevFallback()) {
      res.json({
        presignedUrl: `https://zel-recruit.s3.us-east-1.amazonaws.com/${s3Key}?mock=true`,
        s3Key,
        filename: sanitizedFilename,
        expiresIn: 3600,
      });
      return;
    }

    // Validate opening belongs to tenant
    const opening = await prisma.opening.findFirst({
      where: { id: openingId, tenantId },
    });
    if (!opening) {
      res.status(404).json({ message: "Opening not found in tenant" });
      return;
    }

    const storageService = createStorageService();
    const presignedUrl = await storageService.getUploadURL(s3Key);

    res.json({
      presignedUrl,
      s3Key,
      filename: sanitizedFilename,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("[VendorController] Error generating presigned URL:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 4. Submit Profiles
 * POST /api/vendor/openings/:id/profiles/upload
 * - Must use Prisma transaction
 * - Automatic recommendation trigger on SUBMITTED
 */
export async function submitProfiles(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const tenantId = user.tenant?.tenantId || (user as any).tenantId;
    const openingId = req.params.id;
    const { s3Keys } = req.body;

    const keysToSubmit: string[] = Array.isArray(s3Keys)
      ? s3Keys
      : req.body.s3Key
      ? [req.body.s3Key]
      : [];

    if (keysToSubmit.length === 0) {
      res.status(400).json({ message: "At least one s3Key is required" });
      return;
    }

    if (isDevFallback()) {
      const created = await devMockStore.createProfiles({
        openingId,
        vendorTenantId: tenantId,
        profilesData: keysToSubmit.map((key) => {
          const rawName = key.split("/").pop()?.replace(/^[0-9]+_/, "").replace(/\.[^.]+$/, "") || "Candidate";
          return {
            candidateName: rawName.replace(/_/g, " "),
            email: `${rawName.toLowerCase()}@partner.com`,
            experienceYears: 6,
            skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
            location: "Remote",
            resumeS3Key: key,
            resumeFileName: key.split("/").pop() || "resume.pdf",
          };
        }),
      });
      res.status(201).json({
        message: "Profiles submitted successfully. AI recommendation initiated.",
        profiles: created.map(sanitizeProfileForVendor),
      });
      return;
    }

    // Verify opening belongs to tenant
    const opening = await prisma.opening.findFirst({
      where: { id: openingId, tenantId },
    });
    if (!opening) {
      res.status(404).json({ message: "Opening not found in tenant" });
      return;
    }

    // Transactional profile creation
    const createdProfiles = await prisma.$transaction(async (tx) => {
      const records = [];
      for (const key of keysToSubmit) {
        const profile = await tx.hiringProfile.create({
          data: {
            openingId,
            s3Key: key,
            uploadedBy: user.id,
            status: "SUBMITTED",
            isDeleted: false,
          },
        });
        records.push(profile);
      }
      return records;
    });

    // Automatically trigger AI recommendation asynchronously for each submitted profile
    for (const profile of createdProfiles) {
      recommendationServiceInstance.triggerAsyncProfileRecommendation(profile.id);
    }

    const sanitized = createdProfiles.map(sanitizeProfileForVendor);

    res.status(201).json({
      message: "Profiles submitted successfully. AI recommendation initiated.",
      profiles: sanitized,
    });
  } catch (error: any) {
    console.error("[VendorController] Error submitting profiles:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 5. Soft Delete Profile
 * DELETE /api/vendor/profiles/:id
 * Only the vendor who uploaded the profile can delete it
 */
export async function softDeleteVendorProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const tenantId = user.tenant?.tenantId || (user as any).tenantId || "vendor-partner-tenant-01";
    const profileId = parseInt(req.params.id, 10);

    if (isDevFallback()) {
      const deleted = devMockStore.softDeleteProfile(profileId, tenantId);
      if (!deleted) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }
      res.json({ message: "Profile soft deleted successfully" });
      return;
    }

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    // RBAC: Vendor can only delete their own upload
    if (profile.uploadedBy !== user.id) {
      res.status(403).json({ message: "Unauthorized: You cannot delete profiles uploaded by other vendors" });
      return;
    }

    await prisma.hiringProfile.update({
      where: { id: profileId },
      data: { isDeleted: true },
    });

    res.json({ message: "Profile soft deleted successfully" });
  } catch (error: any) {
    console.error("[VendorController] Error soft deleting profile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 6. File Preview via Backend
 * GET /api/vendor/profiles/:id/preview
 */
export async function previewVendorProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const profileId = parseInt(req.params.id, 10);

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile || profile.isDeleted) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    if (profile.uploadedBy !== user.id) {
      res.status(403).json({ message: "Unauthorized: Cannot access files from other vendors" });
      return;
    }

    const storageService = createStorageService();
    const previewUrl = await storageService.getObjectURL(profile.s3Key);

    res.json({
      s3Key: profile.s3Key,
      previewUrl,
    });
  } catch (error: any) {
    console.error("[VendorController] Error generating preview:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
