import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// DELETE /api/admin/reset-assessment/[userId]?type=SA|MA|BOTH
// Resets the assessment data for a specific awardee.
export async function DELETE(request, { params }) {
  try {
    const me = await getCurrentDbUser();
    if (!me) return new NextResponse('Unauthorized', { status: 401 });
    if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'BOTH';

    const updateData = {};

    if (type === 'SA' || type === 'BOTH') {
      updateData.hasFilledSA = false;
      updateData.saScore = 0;
      updateData.saResponses = null;
      updateData.saDimensionScores = null;
      updateData.saSubmittedAt = null;
    }

    if (type === 'MA' || type === 'BOTH') {
      updateData.hasFilledMA = false;
      updateData.maScore = 0;
      updateData.maResponses = null;
      updateData.maDimensionScores = null;
      updateData.maSubmittedAt = null;
      updateData.maById = null;
    }

    const updated = await prisma.awardeeProfile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Reset assessment error:', error);
    return NextResponse.json(
      { error: 'Gagal mereset data penilaian.' },
      { status: 500 }
    );
  }
}
