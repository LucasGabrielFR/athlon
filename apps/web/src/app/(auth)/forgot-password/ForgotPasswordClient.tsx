'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { forgotPasswordAction } from '@/app/actions/auth';

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const result = await forgotPasswordAction({ email });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5">
      <h2 className="text-2xl font-bold text-ice mb-2">Esqueceu a senha?</h2>
      <p className="text-sm text-ice/50 mb-8">
        Digite seu e-mail e enviaremos um código para você redefinir sua senha.
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">E-mail</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="seu@email.com"
            required
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar Código'}
        </button>
      </form>

      <p className="text-center text-sm text-ice/40 mt-6">
        Lembrou da senha?{' '}
        <Link href="/login" className="text-azure hover:underline">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
