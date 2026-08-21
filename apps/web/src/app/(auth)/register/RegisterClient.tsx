'use client';

import Link from 'next/link';
import { useState } from 'react';
import { registerAction } from '@/app/actions/auth';

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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [step, setStep] = useState<'role' | 'form'>('role');

  const errorMsg = error ? errorMessages[error] : null;

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

      <form action={registerAction} className="space-y-4">
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
          className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors mt-2"
        >
          Criar Conta
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
