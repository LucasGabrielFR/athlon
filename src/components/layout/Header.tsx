import { auth, signOut } from '@/auth';
import Link from 'next/link';

export async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-navy/80 backdrop-blur border-b border-azure/10 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-ice/40 text-sm">Bem-vindo,</span>
        <span className="text-ice font-semibold">{session?.user?.name ?? 'Atleta'}</span>
        {(session?.user as { role?: string })?.role && (
          <span className="text-xs bg-azure/10 text-azure border border-azure/20 px-2 py-0.5 rounded-full capitalize">
            {(session?.user as { role?: string }).role?.replace('_', ' ')}
          </span>
        )}
      </div>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <button
          type="submit"
          className="text-sm text-ice/40 hover:text-red-400 transition-colors"
        >
          Sair →
        </button>
      </form>
    </header>
  );
}
