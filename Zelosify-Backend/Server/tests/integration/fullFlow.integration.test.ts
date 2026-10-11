import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../src/config/prisma/prisma.js";
import {
  presignProfileUploadUrl,
  submitProfiles,
} from "../../src/controllers/vendor/itVendorController.js";
import {
  shortlistProfile,
  rejectProfile,
  getHiringManagerOpeningProfiles,
} from "../../src/controllers/hiring/hiringManagerContractController.js";
import { recommendationServiceInstance } from "../../src/services/ai/recommendationService.js";

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("Full Contract Hiring Lifecycle Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes full flow: Upload Presign -> Submit Profile -> AI Recommendation -> Shortlist", async () => {
    const tenantId = "tenant-wayne-corp";
    const openingId = "opening-uuid-101";
    const vendorUserId = "vendor-bruce-partner";
    const managerUserId = "manager-bruce-wayne";
    const profileId = 777;

    // In-memory mock database state
    const mockDB: any = {
      openings: [
        {
          id: openingId,
          tenantId,
          title: "Senior Full Stack Engineer",
          description: "TypeScript, React, Node.js, PostgreSQL",
          location: "Remote",
          experienceMin: 5,
          experienceMax: 8,
          hiringManagerId: managerUserId,
          status: "OPEN",
          postedDate: new Date(),
        },
      ],
      profiles: [] as any[],
    };

    // Mock Prisma functions
    (vi.spyOn(prisma.opening, "findFirst" as any) as any).mockImplementation(async ({ where }: any) => {
      return mockDB.openings.find(
        (o: any) => o.id === where.id && o.tenantId === where.tenantId
      ) || null;
    });

    (vi.spyOn(prisma.hiringProfile, "findUnique" as any) as any).mockImplementation(async ({ where }: any) => {
      const p = mockDB.profiles.find((p: any) => p.id === where.id);
      if (!p) return null;
      const opening = mockDB.openings.find((o: any) => o.id === p.openingId);
      return { ...p, opening };
    });

    (vi.spyOn(prisma.hiringProfile, "findMany" as any) as any).mockImplementation(async ({ where }: any) => {
      return mockDB.profiles.filter(
        (p: any) => p.openingId === where.openingId && p.isDeleted === (where.isDeleted ?? false)
      );
    });

    (vi.spyOn(prisma.hiringProfile, "update" as any) as any).mockImplementation(async ({ where, data }: any) => {
      const idx = mockDB.profiles.findIndex((p: any) => p.id === where.id);
      if (idx !== -1) {
        mockDB.profiles[idx] = { ...mockDB.profiles[idx], ...data };
        return mockDB.profiles[idx];
      }
      return null;
    });

    (vi.spyOn(prisma, "$transaction" as any) as any).mockImplementation(async (callback: any) => {
      const txMock: any = {
        hiringProfile: {
          create: vi.fn(async ({ data }: any) => {
            const newRecord = {
              id: profileId,
              ...data,
              submittedAt: new Date(),
              isDeleted: false,
            };
            mockDB.profiles.push(newRecord);
            return newRecord;
          }),
          update: vi.fn(async ({ where, data }: any) => {
            const idx = mockDB.profiles.findIndex((p: any) => p.id === where.id);
            if (idx !== -1) {
              mockDB.profiles[idx] = { ...mockDB.profiles[idx], ...data };
              return mockDB.profiles[idx];
            }
            return null;
          }),
        },
      };
      return await callback(txMock);
    });

    // STEP 1: Presign Upload URL (Vendor)
    const presignReq: any = {
      user: { id: vendorUserId, role: "IT_VENDOR", tenant: { tenantId } },
      params: { id: openingId },
      body: { filename: "alex_candidate_resume.pdf" },
    };
    const presignRes = createMockRes();

    await presignProfileUploadUrl(presignReq, presignRes);

    expect(presignRes.json).toHaveBeenCalled();
    const presignData = presignRes.json.mock.calls[0][0];
    expect(presignData.presignedUrl).toBeDefined();
    expect(presignData.s3Key).toContain(`${tenantId}/${openingId}/`);
    const generatedS3Key = presignData.s3Key;

    // STEP 2: Submit Profile in Prisma Transaction (Vendor)
    const submitReq: any = {
      user: { id: vendorUserId, role: "IT_VENDOR", tenant: { tenantId } },
      params: { id: openingId },
      body: { s3Keys: [generatedS3Key] },
    };
    const submitRes = createMockRes();

    await submitProfiles(submitReq, submitRes);

    expect(submitRes.status).toHaveBeenCalledWith(201);
    expect(mockDB.profiles.length).toBe(1);
    expect(mockDB.profiles[0].status).toBe("SUBMITTED");
    expect(mockDB.profiles[0].s3Key).toBe(generatedS3Key);

    // STEP 3: Recommendation Processing via RecommendationService
    // Tests ACID transaction write & idempotent execution
    const recResult = await recommendationServiceInstance.processProfileRecommendation(
      profileId
    );

    expect(recResult).toBeDefined();
    expect(recResult.profileId).toBe(profileId);
    expect(recResult.score).toBeGreaterThan(0);
    expect(mockDB.profiles[0].recommendationScore).toBeDefined();
    expect(mockDB.profiles[0].recommendationReason).toBeDefined();
    expect(mockDB.profiles[0].recommendationLatencyMs).toBeGreaterThanOrEqual(0);

    // STEP 4: Hiring Manager views profile with AI score and explanation
    const getProfilesReq: any = {
      user: { id: managerUserId, role: "HIRING_MANAGER", tenant: { tenantId } },
      params: { id: openingId },
    };
    const getProfilesRes = createMockRes();

    await getHiringManagerOpeningProfiles(getProfilesReq, getProfilesRes);

    expect(getProfilesRes.json).toHaveBeenCalled();
    const managerView = getProfilesRes.json.mock.calls[0][0];
    expect(managerView.profiles.length).toBe(1);
    const viewedProfile = managerView.profiles[0];
    expect(viewedProfile.recommendationBadge).toBeDefined();
    expect(viewedProfile.score).toBeDefined();
    expect(viewedProfile.explanation).toBeDefined();

    // STEP 5: Hiring Manager Shortlists Profile (using Prisma transaction)
    const shortlistReq: any = {
      user: { id: managerUserId, role: "HIRING_MANAGER", tenant: { tenantId } },
      params: { id: String(profileId) },
    };
    const shortlistRes = createMockRes();

    await shortlistProfile(shortlistReq, shortlistRes);

    expect(shortlistRes.json).toHaveBeenCalled();
    expect(mockDB.profiles[0].status).toBe("SHORTLISTED");
    expect(mockDB.profiles[0].shortlistedBy).toBe(managerUserId);

    // STEP 6: Hiring Manager Rejects Profile (using Prisma transaction)
    const rejectReq: any = {
      user: { id: managerUserId, role: "HIRING_MANAGER", tenant: { tenantId } },
      params: { id: String(profileId) },
    };
    const rejectRes = createMockRes();

    await rejectProfile(rejectReq, rejectRes);

    expect(rejectRes.json).toHaveBeenCalled();
    expect(mockDB.profiles[0].status).toBe("REJECTED");
    expect(mockDB.profiles[0].rejectedBy).toBe(managerUserId);

    // STEP 7: Idempotency re-run test: Re-running recommendation updates without error
    const reRunResult = await recommendationServiceInstance.processProfileRecommendation(
      profileId
    );
    expect(reRunResult.score).toBe(recResult.score);
  });
});
