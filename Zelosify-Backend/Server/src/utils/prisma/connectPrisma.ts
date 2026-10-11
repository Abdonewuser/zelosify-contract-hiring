import prisma from "../../config/prisma/prisma.js";

export let isPrismaConnected = false;

export default async function connectPrisma() {
  try {
    await prisma.$connect();
    isPrismaConnected = true;
    console.log("✅ Connected to PostgreSQL");
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      isPrismaConnected = false;
      console.warn("⚠️ PostgreSQL offline on localhost:5445. Running in Dev/Demo in-memory mode.");
    } else {
      console.error("❌ Failed to connect to PostgreSQL:", error);
      process.exit(1);
    }
  }
}
