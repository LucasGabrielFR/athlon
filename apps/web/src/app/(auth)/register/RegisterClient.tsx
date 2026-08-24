'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitRegistrationAction, verifyCodeAction, googleSignInAction } from '@/app/actions/auth';

const errorMessages: Record<string, string> = {
  missing_fields: 'Preencha todos os campos obrigatórios e selecione o tipo de conta.',
  email_taken: 'Este e-mail já está cadastrado.',
};

type Role = 'player' | 'org_president';

const roleOptions: { value: Role; icon: string; title: string; description: string }[] = [
  {
    value: 'player',
    icon: '🎮',
    title: 'Jogador',
    description: 'Compete em torneios, integra clubes e constrói sua carreira competitiva.',
  },
  {
    value: 'org_president',
    icon: '🏛️',
    title: 'Presidente de Organização',
    description: 'Funda federações, organiza competições e impulsiona o ecossistema.',
  },
];

export default function RegisterClient({ error }: { error?: string }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [step, setStep] = useState<'role' | 'form' | 'verify'>('role');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const errorMsg = error ? errorMessages[error] : customError;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setCustomError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!passwordRegex.test(data.password as string)) {
      setCustomError('A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.');
      setLoading(false);
      return;
    }
    
    try {
      const res = await submitRegistrationAction(data);

      if (!res.success) {
        setCustomError(res.message || 'Erro ao registrar.');
        setLoading(false);
        return;
      }

      if (res.requiresVerification) {
        setEmail(data.email as string);
        setStep('verify');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      setCustomError('Erro interno no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setCustomError(null);
    
    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;
    
    try {
      const res = await verifyCodeAction(email, code);

      if (!res.success) {
        setCustomError(res.message || 'Código inválido.');
        setLoading(false);
        return;
      }

      // Success, route to dashboard
      router.push('/dashboard');
    } catch (err) {
      setCustomError('Erro interno no servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5">
        <h2 className="text-2xl font-bold text-ice mb-2">Criar conta</h2>
        <p className="text-sm text-ice/50 mb-8">Qual o seu papel no ecossistema Athlon?</p>

        <div className="space-y-4">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedRole(option.value)}
              className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group ${
                selectedRole === option.value
                  ? 'border-azure bg-azure/10'
                  : 'border-azure/15 bg-navy/50 hover:border-azure/40 hover:bg-navy'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${selectedRole === option.value ? 'text-azure' : 'text-ice'}`}>
                      {option.title}
                    </span>
                    {selectedRole === option.value && (
                      <span className="w-5 h-5 rounded-full border-2 border-azure bg-azure flex items-center justify-center">
                        <span className="text-navy text-xs font-black">✓</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ice/50 mt-0.5">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => selectedRole && setStep('form')}
          disabled={!selectedRole}
          className="w-full mt-6 bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>

        <p className="text-center text-sm text-ice/40 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-azure hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5">
        <h2 className="text-2xl font-bold text-ice mb-2">Verifique seu e-mail</h2>
        <p className="text-sm text-ice/50 mb-8">Enviamos um código de 6 dígitos para o e-mail <span className="text-azure font-bold">{email}</span>.</p>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ❌ {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">
              Código de Verificação <span className="text-azure">*</span>
            </label>
            <input
              type="text"
              name="code"
              placeholder="000000"
              maxLength={6}
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors tracking-[0.5em] text-center font-bold text-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5">
      <button
        onClick={() => setStep('role')}
        className="flex items-center gap-2 text-sm text-ice/40 hover:text-azure transition-colors mb-6"
      >
        ← Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{roleOptions.find((r) => r.value === selectedRole)?.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-ice">
            {roleOptions.find((r) => r.value === selectedRole)?.title}
          </h2>
          <p className="text-xs text-azure/70 uppercase tracking-wider">Conta selecionada</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ❌ {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <input type="hidden" name="role" value={selectedRole ?? ''} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">
              Nome Completo <span className="text-azure">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Lucas Oliveira"
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nickname</label>
            <input
              type="text"
              name="nickname"
              placeholder="@seuNick"
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">
            E-mail <span className="text-azure">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="seu@email.com"
            required
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">
            Senha <span className="text-azure">*</span>
          </label>
          <input
            type="password"
            name="password"
            placeholder="mínimo 8 caracteres"
            required
            minLength={8}
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? 'Criando Conta...' : 'Criar Conta'}
        </button>
      </form>

      <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-azure/10 after:mt-0.5 after:flex-1 after:border-t after:border-azure/10">
        <p className="mx-4 mb-0 text-center text-xs text-ice/40 font-bold uppercase tracking-widest">
          Ou
        </p>
      </div>

      <form action={googleSignInAction}>
        <button
          type="submit"
          className="w-full bg-white dark:bg-slate-dark text-slate-800 dark:text-ice font-bold py-3.5 rounded-xl border border-slate-200 dark:border-azure/20 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com o Google
        </button>
      </form>

      <p className="text-center text-sm text-ice/40 mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-azure hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
