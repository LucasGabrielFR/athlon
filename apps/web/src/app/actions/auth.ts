'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { fetchApi } from '@/lib/api';

const API_URL = typeof window === 'undefined' 
  ? (process.env.API_URL || 'http://api:3001')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export async function googleSignInAction() {
  // Google sign in removed for now. 
  // Will be implemented in NestJS later.
  redirect('/login?error=not_implemented');
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const nickname = formData.get('nickname') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, nickname, email, password, role }),
    });

    if (!res.ok) {
      redirect('/register?error=registration_failed');
    }
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    redirect('/register?error=registration_failed');
  }

  redirect('/login?registered=true');
}

export async function completeOnboardingAction(formData: FormData) {
  const role = formData.get('role') as string;
  const nickname = formData.get('nickname') as string;
  
  try {
    // In the future this will hit a specific endpoint in NestJS
    await fetchApi('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify({ role, nickname })
    });
  } catch (error) {
    redirect('/dashboard/onboarding?error=failed');
  }

  redirect('/dashboard');
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    console.log(`[LOGIN ACTION] Attempting login for ${email} to ${API_URL}/auth/login`);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log(`[LOGIN ACTION] Response status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[LOGIN ACTION] Failed response:`, errText);
      redirect('/login?error=invalid_credentials');
    }

    const data = await res.json();
    console.log(`[LOGIN ACTION] Success! Received token.`);
    
    const cookieStore = await cookies();
    cookieStore.set('token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
  } catch (error) {
    console.error(`[LOGIN ACTION] Caught exception:`, error);
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    redirect('/login?error=invalid_credentials');
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}
