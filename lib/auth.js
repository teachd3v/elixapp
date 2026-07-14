import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns the current signed-in user's database record (including their role),
 * or null if not signed in / not yet synced. Role checks in API routes MUST
 * use this — never trust a role sent from the client.
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
}
