import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../types/typeIndex.js";
import prisma from "../../config/prisma/prisma.js";
import { createStorageService } from "../../services/storage/storageFactory.js";

/**
 * Controller for Hiring Manager Contract Management Operations
 * Strictly enforces:
 * - opening.hiringManagerId === loggedInUser.id
 * - Strict tenant isolation
 * - Full AI recommendation transparency
 */

// Format recommendation badge according to score
function getRecommendationBadge(
  recommended: boolean | null,
  score: number | null
): "RECOMMENDED" | "BORDERLINE" | "NOT_RECOMMENDED" | "PENDING" {
  if (score === null || score === undefined) return "PENDING";
  if (score >= 0.75) return "RECOMMENDED";
  if (score >= 0.5) return "BORDERLINE";
  return "NOT_RECOMMENDED";
}

/**
 * 1. Fetch Openings
 * GET /api/hiring-manager/openings
 * Only own openings under the tenant
 */
export async function getHiringManagerOpenings(req: Request, res: Response): Promise<void> {
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

    const openings = await prisma.opening.findMany({
      where: {
        tenantId,
        hiringManagerId: user.id, // Only own openings
      },
      include: {
        _count: {
          select: {
            hiringProfiles: {
              where: { isDeleted: false },
            },
          },
        },
      },
      orderBy: { postedDate: "desc" },
    });

    res.json({
      openings: openings.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        location: o.location,
        contractType: o.contractType,
        experienceMin: o.experienceMin,
        experienceMax: o.experienceMax,
        postedDate: o.postedDate,
        status: o.status,
        profilesCount: o._count.hiringProfiles,
      })),
    });
  } catch (error: any) {
    console.error("[HiringManagerController] Error fetching openings:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 2. Fetch Profiles for an Opening
 * GET /api/hiring-manager/openings/:id/profiles
 * Mandatory condition: opening.hiringManagerId === loggedInUser.id
 * Must include:
 * - Recommendation badge
 * - Score
 * - Confidence
 * - Explanation
 * - Latency
 */
export async function getHiringManagerOpeningProfiles(req: Request, res: Response): Promise<void> {
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

    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId,
      },
    });

    if (!opening) {
      res.status(404).json({ message: "Opening not found" });
      return;
    }

    // MANDATORY CONDITION: opening.hiringManagerId === loggedInUser.id
    if (opening.hiringManagerId !== user.id) {
      res.status(403).json({
        message: "Forbidden: You can only view profiles for your own openings",
      });
      return;
    }

    const profiles = await prisma.hiringProfile.findMany({
      where: {
        openingId,
        isDeleted: false,
      },
      orderBy: [
        { recommendationScore: "desc" },
        { submittedAt: "desc" },
      ],
    });

    const enrichedProfiles = profiles.map((p) => {
      // Extract original filename from s3Key
      const keyParts = p.s3Key.split("/");
      const rawFile = keyParts[keyParts.length - 1] || p.s3Key;
      const fileName = rawFile.replace(/^\d+_/, "");

      return {
        id: p.id,
        openingId: p.openingId,
        fileName,
        s3Key: p.s3Key,
        uploadedBy: p.uploadedBy,
        submittedAt: p.submittedAt,
        status: p.status,
        recommendationBadge: getRecommendationBadge(p.recommended, p.recommendationScore),
        recommended: p.recommended,
        score: p.recommendationScore !== null ? Number((p.recommendationScore * 100).toFixed(1)) : null,
        confidence: p.recommendationConfidence !== null ? Number((p.recommendationConfidence * 100).toFixed(1)) : null,
        explanation: p.recommendationReason,
        latencyMs: p.recommendationLatencyMs,
        version: p.recommendationVersion,
        shortlistedAt: p.shortlistedAt,
        rejectedAt: p.rejectedAt,
      };
    });

    res.json({
      opening: {
        id: opening.id,
        title: opening.title,
        description: opening.description,
        location: opening.location,
        contractType: opening.contractType,
        experienceMin: opening.experienceMin,
        experienceMax: opening.experienceMax,
        status: opening.status,
      },
      profiles: enrichedProfiles,
    });
  } catch (error: any) {
    console.error("[HiringManagerController] Error fetching opening profiles:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 3. Shortlist Profile
 * POST /api/hiring-manager/profiles/:id/shortlist
 * Mandatory condition: opening.hiringManagerId === loggedInUser.id
 * Must use Prisma transaction
 */
export async function shortlistProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const profileId = parseInt(req.params.id, 10);

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    // MANDATORY CONDITION: opening.hiringManagerId === loggedInUser.id
    if (profile.opening.hiringManagerId !== user.id) {
      res.status(403).json({
        message: "Forbidden: You can only shortlist profiles for your own openings",
      });
      return;
    }

    // ACID transaction
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.hiringProfile.update({
        where: { id: profileId },
        data: {
          status: "SHORTLISTED",
          shortlistedBy: user.id,
          shortlistedAt: new Date(),
          rejectedBy: null,
          rejectedAt: null,
        },
      });
    });

    res.json({
      message: "Profile shortlisted successfully",
      profile: updated,
    });
  } catch (error: any) {
    console.error("[HiringManagerController] Error shortlisting profile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 4. Reject Profile
 * POST /api/hiring-manager/profiles/:id/reject
 * Mandatory condition: opening.hiringManagerId === loggedInUser.id
 * Must use Prisma transaction
 */
export async function rejectProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const profileId = parseInt(req.params.id, 10);

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    // MANDATORY CONDITION: opening.hiringManagerId === loggedInUser.id
    if (profile.opening.hiringManagerId !== user.id) {
      res.status(403).json({
        message: "Forbidden: You can only reject profiles for your own openings",
      });
      return;
    }

    // ACID transaction
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.hiringProfile.update({
        where: { id: profileId },
        data: {
          status: "REJECTED",
          rejectedBy: user.id,
          rejectedAt: new Date(),
          shortlistedBy: null,
          shortlistedAt: null,
        },
      });
    });

    res.json({
      message: "Profile rejected successfully",
      profile: updated,
    });
  } catch (error: any) {
    console.error("[HiringManagerController] Error rejecting profile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * 5. Preview Profile File
 * GET /api/hiring-manager/profiles/:id/preview
 */
export async function previewHiringManagerProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const profileId = parseInt(req.params.id, 10);

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    if (profile.opening.hiringManagerId !== user.id) {
      res.status(403).json({
        message: "Forbidden: You can only access files for your own openings",
      });
      return;
    }

    const storageService = createStorageService();
    const previewUrl = await storageService.getObjectURL(profile.s3Key);

    res.json({
      s3Key: profile.s3Key,
      previewUrl,
    });
  } catch (error: any) {
    console.error("[HiringManagerController] Error generating preview:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
