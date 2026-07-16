import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { defaultDimensionsList, defaultStatements } from '@/data/constants';

// POST /api/admin/seed-instruments
export async function POST() {
  const me = await getCurrentDbUser();
  if (!me || me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const existing = await prisma.dimension.count();
  if (existing > 0) {
    return NextResponse.json({ message: 'Sudah di-seed sebelumnya.', count: existing });
  }

  for (let i = 0; i < defaultDimensionsList.length; i++) {
    const d = defaultDimensionsList[i];
    const dim = await prisma.dimension.create({
      data: {
        order: i,
        name: d.name,
        weight: d.weight,
        color: d.color,
        bg: d.bg,
        text: d.text,
      }
    });

    const statements = defaultStatements.filter(s => s.dimensionId === d.id);
    for (let j = 0; j < statements.length; j++) {
      const s = statements[j];
      await prisma.statement.create({
        data: {
          order: j,
          dimensionId: dim.id,
          aspect: s.aspect,
          code: s.code,
          textAwardee: s.text_awardee,
          textMentor: s.text_mentor,
        }
      });
    }
  }

  return NextResponse.json({ ok: true, message: 'Berhasil melakukan seed data dimensi & statement awal.' });
}
