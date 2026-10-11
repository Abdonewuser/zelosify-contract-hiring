import { AgentOrchestrator } from "./ai/agentOrchestrator.js";
import type { OpeningContext, ProfileContext } from "./ai/types.js";

export interface MockOpening {
  id: string;
  tenantId: string;
  hiringManagerId: string;
  title: string;
  description: string;
  location: string;
  contractType: string;
  experienceMin: number;
  experienceMax: number;
  status: "ACTIVE" | "CLOSED" | "DRAFT";
  createdAt: Date;
  updatedAt: Date;
  tenant?: { tenantId: string; companyName: string };
  hiringManager?: { id: string; username: string; email: string; firstName: string; lastName: string };
  _count?: { profiles: number };
}

export interface MockProfile {
  id: number;
  openingId: string;
  vendorTenantId: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  experienceYears: number;
  skills: string[];
  location: string;
  resumeS3Key: string;
  resumeFileName: string;
  status: "SUBMITTED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  isDeleted: boolean;
  recommended: boolean;
  recommendationScore: number;
  recommendationConfidence: number;
  recommendationReason: string;
  recommendationLatencyMs: number;
  recommendationVersion: string;
  recommendedAt: Date;
  submittedAt: Date;
  updatedAt: Date;
  opening?: MockOpening;
}

const BRUCE_WAYNE_TENANT_ID = "8dc0e05b-2956-4d74-b0e9-5aea5ab3b748";
const BRUCE_WAYNE_MANAGER_ID = "d3a294eb-7fc4-4251-90aa-a8873d004f16";
const VENDOR_TENANT_ID = "vendor-partner-tenant-01";

const SEED_OPENINGS_DATA = [
  {
    id: "op-1",
    title: "Senior Full Stack Engineer",
    description: "Looking for an experienced engineer skilled in TypeScript, React, Node.js, and PostgreSQL to lead high-traffic platform features.",
    location: "Remote",
    contractType: "12-Month Contract",
    experienceMin: 5,
    experienceMax: 8,
  },
  {
    id: "op-2",
    title: "Cloud Solutions Architect",
    description: "Expert in AWS, Kubernetes, Terraform, and distributed cloud microservices. Must have deep cloud security expertise.",
    location: "New York, NY",
    contractType: "C2C",
    experienceMin: 8,
    experienceMax: 12,
  },
  {
    id: "op-3",
    title: "DevOps & Platform Engineer",
    description: "Hands-on CI/CD pipeline automation, Docker, Kubernetes, Prometheus, and AWS infrastructure management.",
    location: "Remote",
    contractType: "6-Month Contract",
    experienceMin: 4,
    experienceMax: 7,
  },
  {
    id: "op-4",
    title: "Frontend Specialist (React / Next.js)",
    description: "Focus on Next.js 14, Tailwind CSS, performance optimization, and responsive design systems.",
    location: "Gotham City",
    contractType: "Full-time Contract",
    experienceMin: 3,
    experienceMax: 5,
  },
  {
    id: "op-5",
    title: "AI / ML Recommendation Engineer",
    description: "Develop production LLM agent pipelines, function calling, vector embeddings, and Python/Node.js scoring engines.",
    location: "Remote",
    contractType: "12-Month Contract",
    experienceMin: 4,
    experienceMax: 8,
  },
  {
    id: "op-6",
    title: "Backend Core Systems Developer",
    description: "High-throughput backend development with Node.js, Express, Prisma, Redis, and relational database optimization.",
    location: "San Francisco, CA",
    contractType: "W2 Contract",
    experienceMin: 5,
    experienceMax: 9,
  },
  {
    id: "op-7",
    title: "Cybersecurity & IAM Specialist",
    description: "Implement OAuth2, Keycloak, RBAC authorization, penetration testing, and zero-trust enterprise security.",
    location: "Gotham City",
    contractType: "12-Month Contract",
    experienceMin: 6,
    experienceMax: 10,
  },
  {
    id: "op-8",
    title: "Database Administrator & Data Architect",
    description: "PostgreSQL query tuning, schema migrations, read-replicas, indexing strategies, and high-availability clustering.",
    location: "Remote",
    contractType: "6-Month Contract",
    experienceMin: 5,
    experienceMax: 8,
  },
  {
    id: "op-9",
    title: "Mobile Application Developer (React Native)",
    description: "Cross-platform iOS and Android mobile development using React Native, TypeScript, and native bridges.",
    location: "Chicago, IL",
    contractType: "Part-time Contract",
    experienceMin: 3,
    experienceMax: 6,
  },
  {
    id: "op-10",
    title: "QA Automation Lead",
    description: "End-to-end integration testing, Vitest, Playwright, Jest, API contract verification, and load testing.",
    location: "Remote",
    contractType: "Full-time Contract",
    experienceMin: 4,
    experienceMax: 7,
  },
  {
    id: "op-11",
    title: "Data Pipeline & ETL Engineer",
    description: "Build robust streaming and batch data ingestion pipelines with Apache Kafka, Python, Spark, and PostgreSQL.",
    location: "Boston, MA",
    contractType: "C2C",
    experienceMin: 4,
    experienceMax: 8,
  },
  {
    id: "op-12",
    title: "Site Reliability Engineer (SRE)",
    description: "Ensure 99.99% availability, automate incident response, manage observability with Grafana, Datadog, and ELK.",
    location: "Remote",
    contractType: "12-Month Contract",
    experienceMin: 5,
    experienceMax: 9,
  },
  {
    id: "op-13",
    title: "Junior Software Engineer",
    description: "Entry-level engineer with strong foundation in JavaScript, TypeScript, Git, and web application basics.",
    location: "Gotham City",
    contractType: "6-Month Contract",
    experienceMin: 1,
    experienceMax: 3,
  },
];

class DevMockStore {
  private openings: MockOpening[] = [];
  private profiles: MockProfile[] = [];
  private nextProfileId = 101;

  constructor() {
    this.init();
  }

  private init() {
    this.openings = SEED_OPENINGS_DATA.map((item) => ({
      id: item.id,
      tenantId: BRUCE_WAYNE_TENANT_ID,
      hiringManagerId: BRUCE_WAYNE_MANAGER_ID,
      title: item.title,
      description: item.description,
      location: item.location,
      contractType: item.contractType,
      experienceMin: item.experienceMin,
      experienceMax: item.experienceMax,
      status: "ACTIVE" as const,
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(),
      tenant: {
        tenantId: BRUCE_WAYNE_TENANT_ID,
        companyName: "Bruce Wayne Corp",
      },
      hiringManager: {
        id: BRUCE_WAYNE_MANAGER_ID,
        username: "bruce_wayne",
        email: "bruce.wayne@waynecorp.com",
        firstName: "Bruce",
        lastName: "Wayne",
      },
    }));

    // Pre-populate candidate profiles with deterministic AI recommendations
    this.profiles = [
      {
        id: 1,
        openingId: "op-1",
        vendorTenantId: VENDOR_TENANT_ID,
        candidateName: "Alex Morgan",
        email: "alex.morgan@partner.com",
        phone: "+1-555-0101",
        experienceYears: 7,
        skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
        location: "Remote",
        resumeS3Key: `${VENDOR_TENANT_ID}/op-1/alex_morgan_resume.pdf`,
        resumeFileName: "alex_morgan_resume.pdf",
        status: "SUBMITTED",
        isDeleted: false,
        recommended: true,
        recommendationScore: 0.88,
        recommendationConfidence: 0.94,
        recommendationReason: "Candidate satisfies all mandatory tech stack criteria (TypeScript, React, Node.js, PostgreSQL) with 7 years of senior experience.",
        recommendationLatencyMs: 245,
        recommendationVersion: "1.0.0",
        recommendedAt: new Date(),
        submittedAt: new Date(Date.now() - 3600000 * 5),
        updatedAt: new Date(),
      },
      {
        id: 2,
        openingId: "op-1",
        vendorTenantId: VENDOR_TENANT_ID,
        candidateName: "David Miller",
        email: "david.miller@partner.com",
        phone: "+1-555-0102",
        experienceYears: 4,
        skills: ["React", "JavaScript", "HTML/CSS"],
        location: "Chicago, IL",
        resumeS3Key: `${VENDOR_TENANT_ID}/op-1/david_miller_resume.pdf`,
        resumeFileName: "david_miller_resume.pdf",
        status: "SUBMITTED",
        isDeleted: false,
        recommended: false,
        recommendationScore: 0.62,
        recommendationConfidence: 0.88,
        recommendationReason: "Moderate frontend proficiency (React, JS), but lacks backend Node.js and PostgreSQL requirements. Experience (4 yrs) is below senior threshold.",
        recommendationLatencyMs: 258,
        recommendationVersion: "1.0.0",
        recommendedAt: new Date(),
        submittedAt: new Date(Date.now() - 3600000 * 3),
        updatedAt: new Date(),
      },
      {
        id: 3,
        openingId: "op-1",
        vendorTenantId: VENDOR_TENANT_ID,
        candidateName: "Elena Rostova",
        email: "elena.rostova@partner.com",
        phone: "+1-555-0103",
        experienceYears: 1,
        skills: ["Node.js", "Express"],
        location: "Miami, FL",
        resumeS3Key: `${VENDOR_TENANT_ID}/op-1/elena_rostova_resume.pdf`,
        resumeFileName: "elena_rostova_resume.pdf",
        status: "SUBMITTED",
        isDeleted: false,
        recommended: false,
        recommendationScore: 0.42,
        recommendationConfidence: 0.95,
        recommendationReason: "Candidate does not meet the minimum 5-year experience requirement (1 year) and lacks React and TypeScript skills.",
        recommendationLatencyMs: 231,
        recommendationVersion: "1.0.0",
        recommendedAt: new Date(),
        submittedAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(),
      },
      {
        id: 4,
        openingId: "op-1",
        vendorTenantId: VENDOR_TENANT_ID,
        candidateName: "Priya Sharma",
        email: "priya.sharma@partner.com",
        phone: "+1-555-0104",
        experienceYears: 8,
        skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "GraphQL"],
        location: "Remote",
        resumeS3Key: `${VENDOR_TENANT_ID}/op-1/priya_sharma_resume.pdf`,
        resumeFileName: "priya_sharma_resume.pdf",
        status: "SHORTLISTED",
        isDeleted: false,
        recommended: true,
        recommendationScore: 0.95,
        recommendationConfidence: 0.97,
        recommendationReason: "Exceptional profile matching all core requirements, 8 years senior experience, and extensive distributed systems leadership.",
        recommendationLatencyMs: 251,
        recommendationVersion: "1.0.0",
        recommendedAt: new Date(),
        submittedAt: new Date(Date.now() - 3600000 * 1),
        updatedAt: new Date(),
      },
    ];
  }

  public getOpenings({
    page = 1,
    limit = 10,
    tenantId,
    isVendor = false,
  }: {
    page?: number;
    limit?: number;
    tenantId?: string;
    isVendor?: boolean;
  }) {
    let filtered = [...this.openings];
    if (!isVendor && tenantId) {
      filtered = filtered.filter((op) => op.tenantId === tenantId);
    }
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit).map((op) => {
      const activeProfilesCount = this.profiles.filter(
        (p) => p.openingId === op.id && !p.isDeleted
      ).length;
      return {
        ...op,
        _count: { profiles: activeProfilesCount },
      };
    });

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public getOpeningById(id: string, tenantId?: string, isVendor = false) {
    const opening = this.openings.find((op) => op.id === id);
    if (!opening) return null;
    if (!isVendor && tenantId && opening.tenantId !== tenantId) {
      return null;
    }
    const activeProfilesCount = this.profiles.filter(
      (p) => p.openingId === opening.id && !p.isDeleted
    ).length;
    return {
      ...opening,
      _count: { profiles: activeProfilesCount },
    };
  }

  public async createProfiles({
    openingId,
    vendorTenantId,
    profilesData,
  }: {
    openingId: string;
    vendorTenantId: string;
    profilesData: Array<{
      candidateName: string;
      email: string;
      phone?: string;
      experienceYears: number;
      skills: string[];
      location: string;
      resumeS3Key: string;
      resumeFileName: string;
    }>;
  }) {
    const opening = this.getOpeningById(openingId, undefined, true);
    if (!opening) throw new Error("Opening not found");

    const created: MockProfile[] = [];

    for (const item of profilesData) {
      const profileId = this.nextProfileId++;

      // Run real AI recommendation orchestrator!
      let aiResult = {
        recommended: false,
        score: 0.5,
        confidence: 0.8,
        explanation: "Processed by AI engine",
        latencyMs: 250,
      };

      try {
        const orchestrator = new AgentOrchestrator();
        const openingContext: OpeningContext = {
          id: opening.id,
          title: opening.title,
          description: opening.description,
          location: opening.location,
          experienceMin: opening.experienceMin,
          experienceMax: opening.experienceMax,
          contractType: opening.contractType,
          requiredSkills: ["TypeScript", "Node.js", "React"],
        };
        const profileContext: ProfileContext = {
          id: profileId,
          openingId: opening.id,
          s3Key: item.resumeS3Key,
          uploadedBy: "dev-vendor-id",
        };
        const orchResult = await orchestrator.evaluateProfile(openingContext, profileContext);
        aiResult = {
          recommended: orchResult.decision.recommended,
          score: orchResult.decision.score,
          confidence: orchResult.decision.confidence,
          explanation: orchResult.decision.reason,
          latencyMs: orchResult.observability.totalLatencyMs || 250,
        };
      } catch (err) {
        console.warn("[DevMockStore] AI evaluation fallback:", err);
      }

      const newProfile: MockProfile = {
        id: profileId,
        openingId,
        vendorTenantId,
        candidateName: item.candidateName,
        email: item.email,
        phone: item.phone || null,
        experienceYears: item.experienceYears,
        skills: item.skills,
        location: item.location,
        resumeS3Key: item.resumeS3Key,
        resumeFileName: item.resumeFileName,
        status: "SUBMITTED",
        isDeleted: false,
        recommended: aiResult.recommended,
        recommendationScore: aiResult.score,
        recommendationConfidence: aiResult.confidence,
        recommendationReason: aiResult.explanation,
        recommendationLatencyMs: aiResult.latencyMs,
        recommendationVersion: "1.0.0",
        recommendedAt: new Date(),
        submittedAt: new Date(),
        updatedAt: new Date(),
        opening,
      };

      this.profiles.push(newProfile);
      created.push(newProfile);
    }

    return created;
  }

  public getProfilesByOpening({
    openingId,
    vendorTenantId,
    page = 1,
    limit = 20,
    status,
    search,
    isHiringManager = false,
  }: {
    openingId: string;
    vendorTenantId?: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    isHiringManager?: boolean;
  }) {
    let filtered = this.profiles.filter(
      (p) => p.openingId === openingId && !p.isDeleted
    );

    if (!isHiringManager && vendorTenantId) {
      filtered = filtered.filter((p) => p.vendorTenantId === vendorTenantId);
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.candidateName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public softDeleteProfile(profileId: number, vendorTenantId: string) {
    const profile = this.profiles.find(
      (p) => p.id === profileId && p.vendorTenantId === vendorTenantId
    );
    if (!profile) return null;
    profile.isDeleted = true;
    profile.updatedAt = new Date();
    return profile;
  }

  public updateCandidateStatus(
    candidateId: number,
    status: "SUBMITTED" | "SHORTLISTED" | "REJECTED" | "HIRED"
  ) {
    const profile = this.profiles.find((p) => p.id === candidateId && !p.isDeleted);
    if (!profile) return null;
    profile.status = status;
    profile.updatedAt = new Date();
    return profile;
  }

  private users: Array<{
    id: string;
    username: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: "HIRING_MANAGER" | "IT_VENDOR" | "ADMIN";
    department: string;
    tenantId: string;
    companyName: string;
    provider: "KEYCLOAK" | "LOCAL";
    totpSecret?: string;
  }> = [
    {
      id: "d3a294eb-7fc4-4251-90aa-a8873d004f16",
      username: "bruce_wayne",
      email: "bruce.wayne@waynecorp.com",
      password: "Password123!",
      firstName: "Bruce",
      lastName: "Wayne",
      phoneNumber: "+15550199",
      role: "HIRING_MANAGER",
      department: "Engineering",
      tenantId: "8dc0e05b-2956-4d74-b0e9-5aea5ab3b748",
      companyName: "Bruce Wayne Corp",
      provider: "KEYCLOAK",
    },
    {
      id: "vendor-user-01",
      username: "vendor_user",
      email: "vendor@partner.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Vendor",
      phoneNumber: "+15550188",
      role: "IT_VENDOR",
      department: "IT Staffing",
      tenantId: "vendor-partner-tenant-01",
      companyName: "Apex Staffing Partners",
      provider: "KEYCLOAK",
    },
    {
      id: "admin-user-01",
      username: "admin",
      email: "admin@zelosify.com",
      password: "Password123!",
      firstName: "Admin",
      lastName: "User",
      phoneNumber: "+15550100",
      role: "ADMIN",
      department: "IT Security",
      tenantId: "8dc0e05b-2956-4d74-b0e9-5aea5ab3b748",
      companyName: "Bruce Wayne Corp",
      provider: "KEYCLOAK",
    },
  ];

  public findUser(usernameOrEmail: string) {
    const q = usernameOrEmail.toLowerCase().trim();
    return this.users.find(
      (u) => u.username.toLowerCase() === q || u.email.toLowerCase() === q
    );
  }

  public addUser(user: {
    id: string;
    username: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: "HIRING_MANAGER" | "IT_VENDOR" | "ADMIN";
    department: string;
    tenantId: string;
    companyName: string;
    provider: "KEYCLOAK" | "LOCAL";
    totpSecret?: string;
  }) {
    const existing = this.findUser(user.username) || this.findUser(user.email);
    if (existing) {
      Object.assign(existing, user);
      return existing;
    }
    this.users.push(user);
    return user;
  }
}

export const devMockStore = new DevMockStore();
