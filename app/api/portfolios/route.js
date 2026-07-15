import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

const CATEGORIES = ['PRESTASI', 'ORGANISASI', 'PELATIHAN', 'KARYA_PERSONAL', 'LAINNYA'];
const MAX_ATTACHMENT_BYTES = 500 * 1024;
function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

// Basic URL check — reject blatantly invalid strings but stay permissive.
export function isValidUrl(s) {
  if (!s) return true; // optional
  try { new URL(s); return true; } catch { return false; }
}

// GET /api/portfolios — list portofolio yang applicable untuk user:
// - AWARDEE   : portofolio miliknya sendiri
// - MENTOR    : portofolio awardee di wilayahnya (support ?awardeeId=X untuk filter satu awardee)
// - SUPERADMIN: semua (support ?awardeeId=X)
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const filterAwardeeId = url.searchParams.get('awardeeId');

  let where;
  if (me.role === 'AWARDEE') {
    const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { id: true } });
    if (!ap) return NextResponse.json([]);
    where = { awardeeId: ap.id };
  } else if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    if (!mp) return NextResponse.json([]);
    where = { awardee: { wilayahId: mp.wilayahId } };
    if (filterAwardeeId) where.awardeeId = filterAwardeeId;
  } else if (me.role === 'SUPERADMIN') {
    where = filterAwardeeId ? { awardeeId: filterAwardeeId } : {};
  } else {
    return NextResponse.json([]);
  }

  const rows = await prisma.portfolio.findMany({
    where,
    orderBy: { date: 'desc' },
    select: {
      id: true, title: true, category: true, date: true, dateEnd: true, isOngoing: true,
      description: true, link: true, attachment: true,
      createdAt: true, updatedAt: true, awardeeId: true,
      awardee: { select: { user: { select: { name: true } } } },
    },
  });
  return NextResponse.json(rows.map((r) => ({
    id: r.id, title: r.title, category: r.category,
    date: r.date, dateEnd: r.dateEnd, isOngoing: r.isOngoing,
    description: r.description, link: r.link, attachment: r.attachment,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
    awardeeId: r.awardeeId, awardeeName: r.awardee?.user?.name || null,
  })));
}

// POST /api/portfolios — AWARDEE only. Body: { title, category, date, description?, attachment? }
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE') return new NextResponse('Forbidden', { status: 403 });

  const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { id: true } });
  if (!ap) return NextResponse.json({ error: 'Lengkapi profil awardee dulu.' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const { title, category, date, dateEnd, isOngoing, description, link, attachment } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: `Kategori tidak valid. Pilih: ${CATEGORIES.join(', ')}` }, { status: 400 });
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Tanggal tidak valid.' }, { status: 400 });

  // Organisasi: dateEnd/isOngoing valid; kategori lain: paksa null/false.
  let dEnd = null;
  let ongoing = false;
  if (category === 'ORGANISASI') {
    ongoing = !!isOngoing;
    if (!ongoing) {
      if (!dateEnd) return NextResponse.json({ error: 'Periode akhir wajib diisi (atau centang "Sampai sekarang").' }, { status: 400 });
      dEnd = new Date(dateEnd);
      if (Number.isNaN(dEnd.getTime())) return NextResponse.json({ error: 'Periode akhir tidak valid.' }, { status: 400 });
      if (dEnd < d) return NextResponse.json({ error: 'Periode akhir tidak boleh sebelum periode awal.' }, { status: 400 });
    }
  }

  if (link && !isValidUrl(link)) return NextResponse.json({ error: 'Format tautan tidak valid.' }, { status: 400 });

  if (attachment) {
    const size = b64Size(attachment);
    if (size < 0) return NextResponse.json({ error: 'Foto lampiran tidak valid.' }, { status: 400 });
    if (size > MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: 'Foto lampiran terlalu besar (>500 KB).' }, { status: 400 });
  }

  const created = await prisma.portfolio.create({
    data: {
      awardeeId: ap.id,
      title: title.trim(),
      category, date: d, dateEnd: dEnd, isOngoing: ongoing,
      description: description?.trim() || null,
      link: link?.trim() || null,
      attachment: attachment || null,
    },
    select: { id: true, title: true, category: true, date: true, dateEnd: true, isOngoing: true, description: true, link: true, attachment: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}
