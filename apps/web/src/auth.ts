import { cookies } from 'next/headers';

export async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

    return {
      user: {
        id: payload.sub?.toString(),
        email: payload.email,
        role: payload.role,
      },
    };
  } catch (e) {
    return null;
  }
}

export async function signOut() {
  // Use logoutAction in components instead
}
