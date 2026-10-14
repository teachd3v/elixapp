import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/interview-records/[id]
export async function GET(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  try {
    const record = await prisma.awardeeInterviewRecord.findUnique({
      where: { id },
      include: {
        awardee: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, phone: true },
            },
            wilayah: {
              select: { id: true, name: true },
            },
          },
        },
        evaluatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Catatan wawancara tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching interview record:', error);
    return NextResponse.json({ error: 'Gagal memuat detail wawancara.' }, { status: 500 });
  }
}

// PUT /api/admin/monev/interview-records/[id]
export async function PUT(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    periodName,
    interviewDate,
    answers,
    generalSummary,
    actionPlan,
  } = body;

  try {
    const existing = await prisma.awardeeInterviewRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Catatan wawancara tidak ditemukan.' }, { status: 404 });
    }

    const dataToUpdate = {};
    if (periodName !== undefined) dataToUpdate.periodName = periodName.trim();
    if (interviewDate !== undefined) dataToUpdate.interviewDate = new Date(interviewDate);
    if (answers !== undefined) dataToUpdate.answers = answers;
    if (generalSummary !== undefined) dataToUpdate.generalSummary = generalSummary?.trim() || null;
    if (actionPlan !== undefined) dataToUpdate.actionPlan = actionPlan?.trim() || null;

    const updated = await prisma.awardeeInterviewRecord.update({
      where: { id },
      data: dataToUpdate,
      include: {
        awardee: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            wilayah: { select: { id: true, name: true } },
          },
        },
        evaluatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating interview record:', error);
    return NextResponse.json({ error: 'Gagal memperbarui catatan wawancara.' }, { status: 500 });
  }
}

// DELETE /api/admin/monev/interview-records/[id]
export async function DELETE(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  try {
    await prisma.awardeeInterviewRecord.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Catatan wawancara berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting interview record:', error);
    return NextResponse.json({ error: 'Gagal menghapus catatan wawancara.' }, { status: 500 });
  }
}
