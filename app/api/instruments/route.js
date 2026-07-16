import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/instruments — List semua dimensi beserta statements-nya, urut berdasarkan `order`.
// Siapa pun yang login bisa lihat (Awardee & Mentor butuh untuk ngisi form, Superadmin buat edit).
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const dimensions = await prisma.dimension.findMany({
    orderBy: { order: 'asc' },
    include: {
      statements: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return NextResponse.json(dimensions);
}

// POST /api/instruments — Superadmin nyimpan struktur dimensi/statements (misal bulk update/reorder/edit).
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me || me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body)) return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });

  // Agar mudah, kita lakukan bulk delete & recreate dalam transaksi (atau upsert).
  // Karena ID mungkin di-referensikan di hasil penilaian lama (JSON), sebaiknya kita pakai Upsert atau simpan ID lamanya.
  // Tapi untuk menyederhanakan MVP: kita update yang ada, delete yang hilang, create yang baru.
  // Di sini kita loop satu-satu untuk amannya.
  
  await prisma.$transaction(async (tx) => {
    // 1. Ambil ID yang dikirim
    const sentDimIds = body.map(d => d.id).filter(Boolean);
    const sentStmtIds = body.flatMap(d => d.statements.map(s => s.id)).filter(Boolean);

    // 2. Hapus yang tidak ada di payload (opsional, hati-hati jika data sudah terpakai).
    // Karena hasil penilaian disimpan di JSON (`saResponses`), menghapus statement aman
    // secara relasi, tapi form lama (jika ingin di-view) mungkin tidak nemu teks aslinya.
    // Tapi untuk editor, kita anggap aman dihapus.
    await tx.statement.deleteMany({ where: { id: { notIn: sentStmtIds } } });
    await tx.dimension.deleteMany({ where: { id: { notIn: sentDimIds } } });

    // 3. Update / Create
    for (let i = 0; i < body.length; i++) {
      const d = body[i];
      let dimId = d.id;
      
      if (dimId) {
        await tx.dimension.update({
          where: { id: dimId },
          data: { order: i, name: d.name, weight: parseFloat(d.weight) || 0, color: d.color, bg: d.bg, text: d.text },
        });
      } else {
        const newDim = await tx.dimension.create({
          data: { order: i, name: d.name, weight: parseFloat(d.weight) || 0, color: d.color, bg: d.bg, text: d.text },
        });
        dimId = newDim.id;
      }

      for (let j = 0; j < d.statements.length; j++) {
        const s = d.statements[j];
        if (s.id) {
          await tx.statement.update({
            where: { id: s.id },
            data: { order: j, dimensionId: dimId, aspect: s.aspect, code: s.code, textAwardee: s.textAwardee, textMentor: s.textMentor },
          });
        } else {
          await tx.statement.create({
            data: { order: j, dimensionId: dimId, aspect: s.aspect, code: s.code, textAwardee: s.textAwardee, textMentor: s.textMentor },
          });
        }
      }
    }
  });

  const fresh = await prisma.dimension.findMany({
    orderBy: { order: 'asc' },
    include: { statements: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json({ ok: true, dimensions: fresh });
}
