import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/wilayah-observations — Ambil riwayat laporan observasi monev wilayah
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const wilayahId = url.searchParams.get('wilayahId');

  const where = {};
  if (wilayahId) where.wilayahId = wilayahId;

  try {
    const observations = await prisma.wilayahMonevObservation.findMany({
      where,
      orderBy: { observationDate: 'desc' },
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
        evaluatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(observations);
  } catch (error) {
    console.error('Error fetching wilayah observations:', error);
    return NextResponse.json({ error: 'Gagal mengambil data laporan observasi wilayah.' }, { status: 500 });
  }
}

// POST /api/admin/monev/wilayah-observations — Simpan laporan observasi monev wilayah baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    wilayahId,
    periodName,
    observationDate,
    programRealization,
    mentorPerformanceSummary,
    sectionAAnswers,
    findings,
    evaluatedById,
  } = body;

  if (!wilayahId) {
    return NextResponse.json({ error: 'Wilayah wajib dipilih.' }, { status: 400 });
  }
  if (!periodName?.trim()) {
    return NextResponse.json({ error: 'Nama Periode Observasi wajib diisi.' }, { status: 400 });
  }
  if (!programRealization?.trim()) {
    return NextResponse.json({ error: 'Kesimpulan Realisasi Pelaksanaan Program wajib diisi.' }, { status: 400 });
  }
  if (!mentorPerformanceSummary?.trim()) {
    return NextResponse.json({ error: 'Kesimpulan Performa Mentor wajib diisi.' }, { status: 400 });
  }

  // Sanitasi format findings
  const sanitizedFindings = Array.isArray(findings)
    ? findings.map((f, idx) => ({
        id: f.id || `finding-${idx + 1}-${Date.now()}`,
        category: f.category ? String(f.category).trim() : '',
        finding: String(f.finding || '').trim(),
        recommendation: String(f.recommendation || '').trim(),
        dueDate: String(f.dueDate || '').trim(),
      })).filter(f => f.finding || f.recommendation)
    : [];

  try {
    const observation = await prisma.wilayahMonevObservation.create({
      data: {
        wilayahId,
        periodName: periodName.trim(),
        observationDate: observationDate ? new Date(observationDate) : new Date(),
        programRealization: programRealization.trim(),
        mentorPerformanceSummary: mentorPerformanceSummary.trim(),
        sectionAAnswers: sectionAAnswers || {},
        findings: sanitizedFindings,
        evaluatedById: evaluatedById || me.id,
      },
      include: {
        wilayah: {
          select: { id: true, name: true },
        },
        evaluatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    console.error('Error creating wilayah observation:', error);
    return NextResponse.json({ error: 'Gagal menyimpan laporan observasi wilayah.' }, { status: 500 });
  }
}
