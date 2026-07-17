const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mentor = await prisma.mentorProfile.findFirst();
  console.log("Mentor:", mentor);
  
  if (!mentor) {
     console.log("No mentor found.");
     return;
  }
  
  const periods = await prisma.assessmentPeriod.findMany({
    include: {
      records: {
        where: { awardee: { wilayahId: mentor.wilayahId } },
      }
    }
  });
  
  const allPeriods = await prisma.assessmentPeriod.findMany({
    include: {
      records: true
    }
  });

  console.log("Periods for Mentor Region:", JSON.stringify(periods, null, 2));
  console.log("All Periods:", JSON.stringify(allPeriods, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
