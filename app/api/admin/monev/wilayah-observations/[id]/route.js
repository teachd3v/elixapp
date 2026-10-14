import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/wilayah-observations/[id]
export async function GET(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  try {
    const observation = await prisma.wilayahMonevObservation.findUnique({
      where: { id },
      include: {
        wilayah: {
          select: {
            id: true,
            name: true,
            mentorProfiles: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        evaluatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!observation) {
      return NextResponse.json({ error: 'Laporan observasi tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(observation);
  } catch (error) {
    console.error('Error fetching wilayah observation:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail laporan observasi.' }, { status: 500 });
  }
}

// PUT /api/admin/monev/wilayah-observations/[id]
export async function PUT(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    periodName,
    observationDate,
    programRealization,
    mentorPerformanceSummary,
    findings,
    evaluatedById,
  } = body;

  try {
    const existing = await prisma.wilayahMonevObservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Laporan observasi tidak ditemukan.' }, { status: 404 });
    }

    const dataToUpdate = {};
    if (periodName !== undefined) dataToUpdate.periodName = periodName.trim();
    if (observationDate !== undefined) dataToUpdate.observationDate = new Date(observationDate);
    if (programRealization !== undefined) dataToUpdate.programRealization = programRealization.trim();
    if (mentorPerformanceSummary !== undefined) dataToUpdate.mentorPerformanceSummary = mentorPerformanceSummary.trim();
    if (evaluatedById !== undefined && evaluatedById) dataToUpdate.evaluatedById = evaluatedById;
    if (findings !== undefined && Array.isArray(findings)) {
      dataToUpdate.findings = findings.map((f, idx) => ({
        id: f.id || `finding-${idx + 1}-${Date.now()}`,
        finding: String(f.finding || '').trim(),
        recommendation: String(f.recommendation || '').trim(),
        dueDate: String(f.dueDate || '').trim(),
      })).filter(f => f.finding || f.recommendation);
    }

    const updated = await prisma.wilayahMonevObservation.update({
      where: { id },
      data: dataToUpdate,
      include: {
        wilayah: { select: { id: true, name: true } },
        evaluatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating wilayah observation:', error);
    return NextResponse.json({ error: 'Gagal memperbarui laporan observasi.' }, { status: 500 });
  }
}

// DELETE /api/admin/monev/wilayah-observations/[id]
export async function DELETE(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  try {
    await prisma.wilayahMonevObservation.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Laporan observasi berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting wilayah observation:', error);
    return NextResponse.json({ error: 'Gagal menghapus laporan observasi.' }, { status: 500 });
  }
}
