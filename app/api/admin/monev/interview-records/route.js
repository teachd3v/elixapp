import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/interview-records — Ambil daftar riwayat wawancara indepth awardee
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const awardeeId = url.searchParams.get('awardeeId');
  const wilayahId = url.searchParams.get('wilayahId');

  const where = {};
  if (awardeeId) where.awardeeId = awardeeId;
  if (wilayahId) {
    where.awardee = { wilayahId };
  }

  try {
    const records = await prisma.awardeeInterviewRecord.findMany({
      where,
      orderBy: { interviewDate: 'desc' },
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
        evaluatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching interview records:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat wawancara.' }, { status: 500 });
  }
}

// POST /api/admin/monev/interview-records — Simpan hasil wawancara baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    awardeeId,
    periodName,
    interviewDate,
    answers,
    generalSummary,
    actionPlan,
  } = body;

  if (!awardeeId) {
    return NextResponse.json({ error: 'Awardee wajib dipilih.' }, { status: 400 });
  }
  if (!periodName?.trim()) {
    return NextResponse.json({ error: 'Nama Periode Wawancara wajib diisi.' }, { status: 400 });
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Jawaban wawancara tidak boleh kosong.' }, { status: 400 });
  }

  try {
    const record = await prisma.awardeeInterviewRecord.create({
      data: {
        awardeeId,
        periodName: periodName.trim(),
        interviewDate: interviewDate ? new Date(interviewDate) : new Date(),
        answers,
        generalSummary: generalSummary?.trim() || null,
        actionPlan: actionPlan?.trim() || null,
        evaluatedById: me.id,
      },
      include: {
        awardee: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            wilayah: { select: { id: true, name: true } },
          },
        },
        evaluatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating interview record:', error);
    return NextResponse.json({ error: 'Gagal menyimpan hasil wawancara.' }, { status: 500 });
  }
}
