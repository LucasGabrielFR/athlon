import { cookies } from 'next/headers';

const API_URL = typeof window === 'undefined' 
  ? (process.env.API_URL || 'http://api:3001')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = 'Ocorreu um erro na API';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Ignora erro de JSON
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }

  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}
