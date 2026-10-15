import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/observation-aspects — Ambil semua aspek observasi wilayah
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  try {
    const aspects = await prisma.wilayahObservationAspect.findMany({
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(aspects);
  } catch (error) {
    console.error('Error fetching observation aspects:', error);
    return NextResponse.json({ error: 'Gagal memuat aspek observasi wilayah.' }, { status: 500 });
  }
}

// POST /api/admin/monev/observation-aspects — Tambah Aspek Observasi baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { section, title, description, order } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Nama aspek wajib diisi.' }, { status: 400 });
  }

  const sec = section === 'SECTION_B' ? 'SECTION_B' : 'SECTION_A';

  try {
    let orderNum = Number(order);
    if (!orderNum || isNaN(orderNum)) {
      const count = await prisma.wilayahObservationAspect.count();
      orderNum = count + 1;
    }

    const newAspect = await prisma.wilayahObservationAspect.create({
      data: {
        section: sec,
        title: title.trim(),
        description: description?.trim() || null,
        order: orderNum,
      },
    });

    return NextResponse.json(newAspect, { status: 201 });
  } catch (error) {
    console.error('Error creating observation aspect:', error);
    return NextResponse.json({ error: 'Gagal menyimpan aspek observasi wilayah.' }, { status: 500 });
  }
}

// PUT /api/admin/monev/observation-aspects — Edit Aspek Observasi
export async function PUT(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { id, section, title, description, order } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID aspek wajib disertakan.' }, { status: 400 });
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Nama aspek wajib diisi.' }, { status: 400 });
  }

  try {
    const updated = await prisma.wilayahObservationAspect.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description !== undefined ? (description?.trim() || null) : undefined,
        ...(section ? { section: section === 'SECTION_B' ? 'SECTION_B' : 'SECTION_A' } : {}),
        ...(order !== undefined && !isNaN(Number(order)) ? { order: Number(order) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating observation aspect:', error);
    return NextResponse.json({ error: 'Gagal memperbarui aspek observasi wilayah.' }, { status: 500 });
  }
}

// DELETE /api/admin/monev/observation-aspects?id=xxx
export async function DELETE(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID aspek wajib disertakan.' }, { status: 400 });
  }

  try {
    await prisma.wilayahObservationAspect.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Aspek berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting observation aspect:', error);
    return NextResponse.json({ error: 'Gagal menghapus aspek observasi wilayah.' }, { status: 500 });
  }
}
