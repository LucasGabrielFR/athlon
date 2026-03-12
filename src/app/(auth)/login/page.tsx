import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';

const errorMessages: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos. Tente novamente.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const { registered, error } = await searchParams;
  const errorMsg = error ? (errorMessages[error] ?? 'Ocorreu um erro. Tente novamente.') : null;

  return (
    <div className="bg-slate rounded-2xl border border-azure/20 p-8 shadow-2xl shadow-azure/5">
      <h2 className="text-2xl font-bold text-ice mb-2">Bem-vindo de volta</h2>
      <p className="text-sm text-ice/50 mb-8">Entre com suas credenciais para continuar</p>

      {registered && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          ✅ Conta criada com sucesso! Faça login para continuar.
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ❌ {errorMsg}
        </div>
      )}

      <form action={loginAction} className="space-y-4">
        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">E-mail</label>
          <input
            type="email"
            name="email"
            placeholder="seu@email.com"
            required
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Senha</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors mt-2"
        >
          Entrar
        </button>
      </form>

      <p className="text-center text-sm text-ice/40 mt-6">
        Não tem conta?{' '}
        <Link href="/register" className="text-azure hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
