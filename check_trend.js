const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const periods = await prisma.assessmentPeriod.findMany({
    include: {
      records: true
    }
  });
  console.log("Periods:", JSON.stringify(periods, null, 2));

  const awardees = await prisma.awardeeProfile.findMany({
    select: { id: true, saScore: true, maScore: true, wilayahId: true }
  });
  console.log("Awardees:", awardees);
}

main().catch(console.error).finally(() => prisma.$disconnect());
