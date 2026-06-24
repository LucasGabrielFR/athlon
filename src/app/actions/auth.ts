'use server';

import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/password';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function googleSignInAction() {
  await signIn('google', { redirectTo: '/dashboard' });
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const nickname = formData.get('nickname') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const validRoles = ['player', 'org_president'];

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
    role: role as 'player' | 'org_president',
  });

  // Generate Verification Token
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours validity

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  // Send Email
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: 'Athlon <onboarding@resend.dev>', // Update with verified domain in production
        to: email,
        subject: 'Confirme sua conta no Athlon',
        html: `
          <h1>Bem-vindo ao Athlon!</h1>
          <p>Olá, ${name}. Por favor, clique no link abaixo para confirmar seu endereço de e-mail e ativar sua conta:</p>
          <a href="${confirmLink}" style="display:inline-block;padding:12px 24px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:4px;">Confirmar E-mail</a>
          <p>Ou copie e cole este link no seu navegador: ${confirmLink}</p>
        `,
      });
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }
  } else {
    console.log('RESEND_API_KEY not set. Verification link:', confirmLink);
  }

  redirect('/login?registered=true');
}

export async function completeOnboardingAction(formData: FormData) {
  const role = formData.get('role') as string;
  const nickname = formData.get('nickname') as string;
  
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const validRoles = ['player', 'org_president'];
  if (!validRoles.includes(role)) {
    redirect('/dashboard/onboarding?error=invalid_role');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email)
  });

  if (!user) redirect('/login');

  await db.update(users).set({
    role: role as 'player' | 'org_president',
    nickname: nickname || null,
  }).where(eq(users.id, user.id));

  redirect('/dashboard');
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
