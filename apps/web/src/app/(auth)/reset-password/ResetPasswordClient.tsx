'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPasswordAction } from '@/app/actions/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const code = formData.get('code') as string;
    const newPassword = formData.get('newPassword') as string;

    const result = await resetPasswordAction({ email, code, newPassword });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  if (success) {
    return (
      <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5 text-center">
        <h2 className="text-2xl font-bold text-emerald-400 mb-2">Senha Redefinida!</h2>
        <p className="text-sm text-ice/80 mb-6">
          Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes...
        </p>
        <Link href="/login" className="text-azure hover:underline font-bold">
          Ir para o Login agora
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5">
      <h2 className="text-2xl font-bold text-ice mb-2">Criar nova senha</h2>
      <p className="text-sm text-ice/50 mb-8">
        Insira o código de 6 dígitos que enviamos para o seu e-mail e escolha uma nova senha.
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
            defaultValue={defaultEmail}
            readOnly={!!defaultEmail}
            required
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors read-only:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="code" className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Código de 6 dígitos</label>
          <input
            id="code"
            type="text"
            name="code"
            placeholder="Ex: 123456"
            required
            maxLength={6}
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors text-center tracking-[0.5em] font-bold"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nova Senha</label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            placeholder="••••••••"
            required
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
          />
          <p className="text-[10px] text-ice/40 mt-1">Mínimo 8 caracteres, maiúscula, minúscula, número e símbolo.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? 'Redefinindo...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={<div className="text-center text-ice">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
