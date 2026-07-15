import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { isValidUrl } from '../route';

const CATEGORIES = ['PRESTASI', 'ORGANISASI', 'PELATIHAN', 'KARYA_PERSONAL', 'LAINNYA'];
const MAX_ATTACHMENT_BYTES = 500 * 1024;
function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

// Owner (awardee) atau SUPERADMIN.
async function loadForMutation(me, id) {
  const port = await prisma.portfolio.findUnique({ where: { id }, include: { awardee: { select: { userId: true } } } });
  if (!port) return { port: null, allowed: false };
  const allowed = me.role === 'SUPERADMIN' || (me.role === 'AWARDEE' && port.awardee.userId === me.id);
  return { port, allowed };
}

// PATCH /api/portfolios/[id] — edit. Awardee owner only (superadmin bisa tapi biasanya tidak).
export async function PATCH(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const { port, allowed } = await loadForMutation(me, id);
  if (!port) return new NextResponse('Portofolio tidak ditemukan', { status: 404 });
  if (!allowed) return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const data = {};

  if (typeof body.title === 'string') {
    if (!body.title.trim()) return NextResponse.json({ error: 'Judul tidak boleh kosong.' }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) return NextResponse.json({ error: `Kategori tidak valid.` }, { status: 400 });
    data.category = body.category;
  }
  if (body.date !== undefined) {
    const d = new Date(body.date);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Tanggal tidak valid.' }, { status: 400 });
    data.date = d;
  }
  // Effective category setelah PATCH ini (untuk validasi dateEnd)
  const effectiveCategory = data.category || port.category;
  if (body.isOngoing !== undefined) data.isOngoing = !!body.isOngoing;
  if (body.dateEnd !== undefined) {
    if (body.dateEnd === null || body.dateEnd === '') {
      data.dateEnd = null;
    } else {
      const de = new Date(body.dateEnd);
      if (Number.isNaN(de.getTime())) return NextResponse.json({ error: 'Periode akhir tidak valid.' }, { status: 400 });
      data.dateEnd = de;
    }
  }
  // Kalau kategori berubah menjadi non-Organisasi, bersihkan field khusus organisasi.
  if (data.category && data.category !== 'ORGANISASI') {
    data.dateEnd = null;
    data.isOngoing = false;
  }
  // Kalau Organisasi & tidak ongoing, dateEnd wajib ada (setelah merge)
  if (effectiveCategory === 'ORGANISASI') {
    const finalOngoing = data.isOngoing !== undefined ? data.isOngoing : port.isOngoing;
    const finalDateEnd = data.dateEnd !== undefined ? data.dateEnd : port.dateEnd;
    if (!finalOngoing && !finalDateEnd) {
      return NextResponse.json({ error: 'Periode akhir wajib diisi (atau centang "Sampai sekarang").' }, { status: 400 });
    }
    if (finalOngoing) data.dateEnd = null;
  }
  if (body.link !== undefined) {
    const trimmed = body.link?.trim() || null;
    if (trimmed && !isValidUrl(trimmed)) return NextResponse.json({ error: 'Format tautan tidak valid.' }, { status: 400 });
    data.link = trimmed;
  }
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.attachment !== undefined) {
    if (body.attachment === null) {
      data.attachment = null;
    } else {
      const size = b64Size(body.attachment);
      if (size < 0) return NextResponse.json({ error: 'Foto lampiran tidak valid.' }, { status: 400 });
      if (size > MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: 'Foto lampiran terlalu besar (>500 KB).' }, { status: 400 });
      data.attachment = body.attachment;
    }
  }

  const updated = await prisma.portfolio.update({
    where: { id }, data,
    select: { id: true, title: true, category: true, date: true, dateEnd: true, isOngoing: true, description: true, link: true, attachment: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}

// DELETE /api/portfolios/[id] — owner or superadmin.
export async function DELETE(_request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const { port, allowed } = await loadForMutation(me, id);
  if (!port) return new NextResponse('Portofolio tidak ditemukan', { status: 404 });
  if (!allowed) return new NextResponse('Forbidden', { status: 403 });

  await prisma.portfolio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
