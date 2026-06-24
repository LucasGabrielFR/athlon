import Link from 'next/link';
import { loginAction, googleSignInAction } from '@/app/actions/auth';

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

      <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-azure/10 after:mt-0.5 after:flex-1 after:border-t after:border-azure/10">
        <p className="mx-4 mb-0 text-center text-xs text-ice/40 font-bold uppercase tracking-widest">
          Ou
        </p>
      </div>

      <form action={googleSignInAction}>
        <button
          type="submit"
          className="w-full bg-white text-slate-dark font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar com o Google
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
