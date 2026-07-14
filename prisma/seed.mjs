import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Program coaching regions (Wilayah). Idempotent — safe to re-run.
const REGIONS = [
  'Bogor',
  'Jakarta Barat',
  'Jakarta Timur',
  'Depok',
  'Bekasi',
  'Tangerang',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Malang',
  'Medan',
  'Makassar',
];

try {
  for (const name of REGIONS) {
    await prisma.wilayah.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const total = await prisma.wilayah.count();
  console.log(`Seeded wilayah. Total in DB: ${total}`);
} catch (e) {
  console.error('Seed failed:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
