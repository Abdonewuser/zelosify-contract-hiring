import prisma from "../config/prisma/prisma.js";

/**
 * Seeds the database with sample job openings for testing purposes.
 * Pre-populates:
 * - Tenant: "Bruce Wayne Corp"
 * - At least 12 openings with different roles, experience ranges, and contract types
 * - Strict tenant isolation
 */
export async function seedOpenings() {
  try {
    console.log("🌱 Seeding Bruce Wayne Corp and 12+ openings data...");

    // 1. Find or create Tenant: "Bruce Wayne Corp"
    let tenant = await prisma.tenants.findFirst({
      where: { companyName: "Bruce Wayne Corp" },
    });

    if (!tenant) {
      tenant = await prisma.tenants.create({
        data: {
          companyName: "Bruce Wayne Corp",
        },
      });
      console.log(`✅ Created tenant: ${tenant.companyName} (${tenant.tenantId})`);
    } else {
      console.log(`ℹ️ Tenant exists: ${tenant.companyName} (${tenant.tenantId})`);
    }

    // 2. Find or create Hiring Manager user for Bruce Wayne Corp
    let hiringManager = await prisma.user.findFirst({
      where: {
        email: "bruce.wayne@waynecorp.com",
        tenantId: tenant.tenantId,
      },
    });

    if (!hiringManager) {
      hiringManager = await prisma.user.create({
        data: {
          email: "bruce.wayne@waynecorp.com",
          username: "bruce_wayne",
          firstName: "Bruce",
          lastName: "Wayne",
          role: "HIRING_MANAGER",
          department: "Engineering",
          tenantId: tenant.tenantId,
          profileComplete: true,
          provider: "KEYCLOAK",
        },
      });
      console.log(`✅ Created hiring manager: ${hiringManager.username} (${hiringManager.id})`);
    }

    // 3. Define 12 diverse openings
    const openingsData = [
      {
        title: "Senior Full Stack Engineer",
        description: "Looking for an experienced engineer skilled in TypeScript, React, Node.js, and PostgreSQL to lead high-traffic platform features.",
        location: "Remote",
        contractType: "12-Month Contract",
        experienceMin: 5,
        experienceMax: 8,
      },
      {
        title: "Cloud Solutions Architect",
        description: "Expert in AWS, Kubernetes, Terraform, and distributed cloud microservices. Must have deep cloud security expertise.",
        location: "New York, NY",
        contractType: "C2C",
        experienceMin: 8,
        experienceMax: 12,
      },
      {
        title: "DevOps & Platform Engineer",
        description: "Hands-on CI/CD pipeline automation, Docker, Kubernetes, Prometheus, and AWS infrastructure management.",
        location: "Remote",
        contractType: "6-Month Contract",
        experienceMin: 4,
        experienceMax: 7,
      },
      {
        title: "Frontend Specialist (React / Next.js)",
        description: "Focus on Next.js 14, Tailwind CSS, performance optimization, and responsive design systems.",
        location: "Gotham City",
        contractType: "Full-time Contract",
        experienceMin: 3,
        experienceMax: 5,
      },
      {
        title: "AI / ML Recommendation Engineer",
        description: "Develop production LLM agent pipelines, function calling, vector embeddings, and Python/Node.js scoring engines.",
        location: "Remote",
        contractType: "12-Month Contract",
        experienceMin: 4,
        experienceMax: 8,
      },
      {
        title: "Backend Core Systems Developer",
        description: "High-throughput backend development with Node.js, Express, Prisma, Redis, and relational database optimization.",
        location: "San Francisco, CA",
        contractType: "W2 Contract",
        experienceMin: 5,
        experienceMax: 9,
      },
      {
        title: "Cybersecurity & IAM Specialist",
        description: "Implement OAuth2, Keycloak, RBAC authorization, penetration testing, and zero-trust enterprise security.",
        location: "Gotham City",
        contractType: "12-Month Contract",
        experienceMin: 6,
        experienceMax: 10,
      },
      {
        title: "Database Administrator & Data Architect",
        description: "PostgreSQL query tuning, schema migrations, read-replicas, indexing strategies, and high-availability clustering.",
        location: "Remote",
        contractType: "6-Month Contract",
        experienceMin: 5,
        experienceMax: 8,
      },
      {
        title: "Mobile Application Developer (React Native)",
        description: "Cross-platform iOS and Android mobile development using React Native, TypeScript, and native bridges.",
        location: "Chicago, IL",
        contractType: "Part-time Contract",
        experienceMin: 3,
        experienceMax: 6,
      },
      {
        title: "QA Automation Lead",
        description: "End-to-end integration testing, Vitest, Playwright, Jest, API contract verification, and load testing.",
        location: "Remote",
        contractType: "Full-time Contract",
        experienceMin: 4,
        experienceMax: 7,
      },
      {
        title: "Data Pipeline & ETL Engineer",
        description: "Build robust streaming and batch data ingestion pipelines with Apache Kafka, Python, Spark, and PostgreSQL.",
        location: "Boston, MA",
        contractType: "C2C",
        experienceMin: 4,
        experienceMax: 8,
      },
      {
        title: "Site Reliability Engineer (SRE)",
        description: "Ensure 99.99% availability, automate incident response, manage observability with Grafana, Datadog, and ELK.",
        location: "Remote",
        contractType: "12-Month Contract",
        experienceMin: 5,
        experienceMax: 9,
      },
      {
        title: "Junior Software Engineer",
        description: "Entry-level engineer with strong foundation in JavaScript, TypeScript, Git, and web application basics.",
        location: "Gotham City",
        contractType: "6-Month Contract",
        experienceMin: 1,
        experienceMax: 3,
      },
    ];

    for (const item of openingsData) {
      const existing = await prisma.opening.findFirst({
        where: {
          title: item.title,
          tenantId: tenant.tenantId,
        },
      });

      if (!existing) {
        await prisma.opening.create({
          data: {
            title: item.title,
            description: item.description,
            location: item.location,
            contractType: item.contractType,
            experienceMin: item.experienceMin,
            experienceMax: item.experienceMax,
            status: "OPEN",
            tenantId: tenant.tenantId,
            hiringManagerId: hiringManager.id,
          },
        });
        console.log(`  + Created opening: "${item.title}"`);
      } else {
        console.log(`  • Opening already exists: "${item.title}"`);
      }
    }

    const totalCount = await prisma.opening.count({
      where: { tenantId: tenant.tenantId },
    });

    console.log(`🎉 Seeding complete. Total openings for ${tenant.companyName}: ${totalCount}`);
    return { tenantId: tenant.tenantId, hiringManagerId: hiringManager.id, totalCount };
  } catch (error) {
    console.error("❌ Error seeding openings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if invoked directly
if (process.argv[1]?.endsWith("seedOpenings.ts") || process.argv[1]?.endsWith("seedOpenings.js")) {
  seedOpenings();
}
