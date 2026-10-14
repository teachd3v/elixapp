import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/interview-questions — Ambil semua aspek dan pertanyaan wawancara
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  try {
    const aspects = await prisma.awardeeInterviewAspect.findMany({
      orderBy: { order: 'asc' },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(aspects);
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    return NextResponse.json({ error: 'Gagal memuat pertanyaan wawancara.' }, { status: 500 });
  }
}

// POST /api/admin/monev/interview-questions — Tambah Aspek atau Pertanyaan baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { type, name, description, aspectId, question, guideNotes } = body;

  try {
    if (type === 'ASPECT') {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Nama aspek wajib diisi.' }, { status: 400 });
      }

      const count = await prisma.awardeeInterviewAspect.count();
      const newAspect = await prisma.awardeeInterviewAspect.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          order: count + 1,
        },
        include: { questions: true },
      });

      return NextResponse.json(newAspect, { status: 201 });
    }

    if (type === 'QUESTION') {
      if (!aspectId) {
        return NextResponse.json({ error: 'Aspek wajib dipilih.' }, { status: 400 });
      }
      if (!question?.trim()) {
        return NextResponse.json({ error: 'Teks pertanyaan wajib diisi.' }, { status: 400 });
      }

      const count = await prisma.awardeeInterviewQuestion.count({
        where: { aspectId },
      });

      const newQuestion = await prisma.awardeeInterviewQuestion.create({
        data: {
          aspectId,
          question: question.trim(),
          guideNotes: guideNotes?.trim() || null,
          order: count + 1,
        },
      });

      return NextResponse.json(newQuestion, { status: 201 });
    }

    return NextResponse.json({ error: 'Tipe request tidak valid (pilih ASPECT atau QUESTION).' }, { status: 400 });
  } catch (error) {
    console.error('Error creating interview aspect/question:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pertanyaan wawancara.' }, { status: 500 });
  }
}

// DELETE /api/admin/monev/interview-questions?type=aspect&id=xxx or ?type=question&id=xxx
export async function DELETE(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID wajib disertakan.' }, { status: 400 });
  }

  try {
    if (type === 'aspect') {
      await prisma.awardeeInterviewAspect.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Aspek berhasil dihapus.' });
    }
    if (type === 'question') {
      await prisma.awardeeInterviewQuestion.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Pertanyaan berhasil dihapus.' });
    }

    return NextResponse.json({ error: 'Tipe tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting interview question/aspect:', error);
    return NextResponse.json({ error: 'Gagal menghapus butir instrumen.' }, { status: 500 });
  }
}
