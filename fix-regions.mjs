import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const NEW_REGIONS = [
  'Langkat', 'Padang', 'Pekanbaru', 'Bogor', 'Yogyakarta', 'Surabaya', 'Palembang', 'Aceh Utara', 'Pidie Jaya', 'Dumai', 'Sinjai'
];

async function run() {
  try {
    const allWilayah = await prisma.wilayah.findMany({ orderBy: { name: 'asc' } });
    
    // First, update existing ones to avoid unique constraint collisions during the process
    for (let i = 0; i < allWilayah.length; i++) {
        await prisma.wilayah.update({
            where: { id: allWilayah[i].id },
            data: { name: `TEMP_REGION_${i}` }
        });
    }

    for (let i = 0; i < Math.min(allWilayah.length, NEW_REGIONS.length); i++) {
      await prisma.wilayah.update({
        where: { id: allWilayah[i].id },
        data: { name: NEW_REGIONS[i] }
      });
    }
    
    // If there are more NEW_REGIONS than existing
    for (let i = allWilayah.length; i < NEW_REGIONS.length; i++) {
       await prisma.wilayah.create({ data: { name: NEW_REGIONS[i] } });
    }
    
    // If there are extra existing regions
    for (let i = NEW_REGIONS.length; i < allWilayah.length; i++) {
       try {
         await prisma.wilayah.delete({ where: { id: allWilayah[i].id } });
       } catch(e) {
         await prisma.wilayah.update({ where: { id: allWilayah[i].id }, data: { name: 'Inactive Region ' + i }});
       }
    }
    
    console.log('Successfully updated regions to the new list!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
