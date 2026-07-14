import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Neon's serverless driver needs a WebSocket implementation when running in
// Node.js. Node 22+ ships a global WebSocket, but we set it explicitly so the
// connection also works on runtimes/deploys that don't expose one.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Prisma cannot connect to Neon without it.'
    );
  }

  // Prisma 7 uses a WASM query compiler and requires a driver adapter to
  // actually talk to the database — `new PrismaClient()` on its own has no
  // connection. The Neon adapter carries the connection string.
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
