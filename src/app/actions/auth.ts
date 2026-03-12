'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/password';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';



export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const nickname = formData.get('nickname') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const validRoles = ['player', 'league_president'];

  if (!name || !email || !password || !validRoles.includes(role)) {
    redirect('/register?error=missing_fields');
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    redirect('/register?error=email_taken');
  }

  await db.insert(users).values({
    name,
    nickname: nickname || null,
    email,
    passwordHash: await hashPassword(password),
    role: role as 'player' | 'league_president',
  });

  redirect('/login?registered=true');
}

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    // Auth.js throws a redirect on success; we must re-throw it
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // For any other error (wrong credentials, etc.), redirect with error param
    redirect('/login?error=invalid_credentials');
  }
}
