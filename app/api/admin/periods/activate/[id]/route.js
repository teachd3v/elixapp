import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const user = await getCurrentDbUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const newActiveId = id;
    const newPeriod = await prisma.assessmentPeriod.findUnique({ where: { id: newActiveId } });
    if (!newPeriod) return NextResponse.json({ error: 'Period not found' }, { status: 404 });

    // Find currently active period
    const currentActive = await prisma.assessmentPeriod.findFirst({
      where: { isActive: true }
    });

    if (currentActive && currentActive.id === newActiveId) {
       return NextResponse.json({ success: true, message: 'Already active' });
    }

    // Begin transaction for safety
    await prisma.$transaction(async (tx) => {
      const allAwardees = await tx.awardeeProfile.findMany();

      // 1. If there is a current active period (or if this is the very first time and we assume current profiles belong to the new period... wait)
      // Actually, to be safe: whenever we switch away from a period, we MUST save the current AwardeeProfile state into that period's AssessmentRecords.
      if (currentActive) {
        // Save current profiles to currentActive records
        for (const a of allAwardees) {
          await tx.assessmentRecord.upsert({
            where: { awardeeId_periodId: { awardeeId: a.id, periodId: currentActive.id } },
            update: {
              saScore: a.saScore, maScore: a.maScore, hasFilledSA: a.hasFilledSA, hasFilledMA: a.hasFilledMA,
              saResponses: a.saResponses, saDimensionScores: a.saDimensionScores, saSubmittedAt: a.saSubmittedAt,
              maResponses: a.maResponses, maDimensionScores: a.maDimensionScores, maSubmittedAt: a.maSubmittedAt, maById: a.maById
            },
            create: {
              awardeeId: a.id, periodId: currentActive.id,
              saScore: a.saScore, maScore: a.maScore, hasFilledSA: a.hasFilledSA, hasFilledMA: a.hasFilledMA,
              saResponses: a.saResponses, saDimensionScores: a.saDimensionScores, saSubmittedAt: a.saSubmittedAt,
              maResponses: a.maResponses, maDimensionScores: a.maDimensionScores, maSubmittedAt: a.maSubmittedAt, maById: a.maById
            }
          });
        }
      } else {
        // First time activating ANY period. The current AwardeeProfile data should be saved into this newly activated period!
        for (const a of allAwardees) {
          await tx.assessmentRecord.upsert({
            where: { awardeeId_periodId: { awardeeId: a.id, periodId: newActiveId } },
            update: {
              saScore: a.saScore, maScore: a.maScore, hasFilledSA: a.hasFilledSA, hasFilledMA: a.hasFilledMA,
              saResponses: a.saResponses, saDimensionScores: a.saDimensionScores, saSubmittedAt: a.saSubmittedAt,
              maResponses: a.maResponses, maDimensionScores: a.maDimensionScores, maSubmittedAt: a.maSubmittedAt, maById: a.maById
            },
            create: {
              awardeeId: a.id, periodId: newActiveId,
              saScore: a.saScore, maScore: a.maScore, hasFilledSA: a.hasFilledSA, hasFilledMA: a.hasFilledMA,
              saResponses: a.saResponses, saDimensionScores: a.saDimensionScores, saSubmittedAt: a.saSubmittedAt,
              maResponses: a.maResponses, maDimensionScores: a.maDimensionScores, maSubmittedAt: a.maSubmittedAt, maById: a.maById
            }
          });
        }
      }

      // 2. Deactivate all periods
      await tx.assessmentPeriod.updateMany({
        data: { isActive: false }
      });

      // 3. Activate new period
      await tx.assessmentPeriod.update({
        where: { id: newActiveId },
        data: { isActive: true }
      });

      // 4. Load the new period's records into AwardeeProfile (only if we didn't just initialize it from them)
      if (currentActive) {
        for (const a of allAwardees) {
          const rec = await tx.assessmentRecord.findUnique({
            where: { awardeeId_periodId: { awardeeId: a.id, periodId: newActiveId } }
          });
          if (rec) {
             await tx.awardeeProfile.update({
                where: { id: a.id },
                data: {
                  saScore: rec.saScore, maScore: rec.maScore, hasFilledSA: rec.hasFilledSA, hasFilledMA: rec.hasFilledMA,
                  saResponses: rec.saResponses, saDimensionScores: rec.saDimensionScores, saSubmittedAt: rec.saSubmittedAt,
                  maResponses: rec.maResponses, maDimensionScores: rec.maDimensionScores, maSubmittedAt: rec.maSubmittedAt, maById: rec.maById
                }
             });
          } else {
             // Reset profile if no record exists for this new period
             await tx.awardeeProfile.update({
                where: { id: a.id },
                data: {
                  saScore: 0, maScore: 0, hasFilledSA: false, hasFilledMA: false,
                  saResponses: null, saDimensionScores: null, saSubmittedAt: null,
                  maResponses: null, maDimensionScores: null, maSubmittedAt: null, maById: null
                }
             });
          }
        }
      }

    }); // end transaction

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activate period error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
