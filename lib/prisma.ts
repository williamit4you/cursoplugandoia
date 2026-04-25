import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use a Proxy to make Prisma initialization lazy.
// This prevents Prisma from trying to connect or validate during Next.js build time
// when the database might not be accessible or environment variables are being collected.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!globalForPrisma.prisma) {
      const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});
