import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response('Token ausente', { status: 400 });
  }

  const vt = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, new Date())
    )
  });

  if (!vt) {
    return new Response('Token inválido ou expirado', { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, vt.identifier)
  });

  if (!user) {
    return new Response('Usuário não encontrado', { status: 404 });
  }

  // Update user as verified
  await db.update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, user.id));

  // Delete the token
  await db.delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  redirect('/login?verified=true');
}
