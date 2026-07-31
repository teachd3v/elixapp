import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ambil data user dari Clerk
    const user = await currentUser();
    if (!user) {
      return new NextResponse('User not found in Clerk', { status: 404 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'Unknown';
    const avatarUrl = user.imageUrl;

    // Cek apakah user sudah ada di database Neon berdasarkan clerkId
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser && email) {
      // Jika tidak ketemu pakai clerkId, coba cari pakai email (kasus migrasi dari dev ke prod Clerk)
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (existingEmailUser) {
        // Kalau emailnya udah ada di DB, kita update aja clerkId-nya dengan yang baru dari Production
        dbUser = await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: { clerkId: userId }
        });
      }
    }

    if (!dbUser) {
      // Jika belum ada, buat baru
      // HARDCODE: Jika email adalah teach.d3v@gmail.com, jadikan SUPERADMIN otomatis
      let defaultRole = 'UNVERIFIED';
      if (email === 'teach.d3v@gmail.com') {
        defaultRole = 'SUPERADMIN';
      }

      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          name: name,
          avatarUrl: avatarUrl,
          role: defaultRole,
          isProfileComplete: false
        }
      });
    }

    return NextResponse.json(dbUser);

  } catch (error) {
    console.error('Error syncing user:', error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
