import Link from 'next/link';
import { auth } from '@/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/profile', label: 'Meu Perfil', icon: '👤' },
  { href: '/dashboard/players', label: 'Jogadores', icon: '👥' },
  { href: '/dashboard/clubs', label: 'Clubes', icon: '🛡️' },
  { href: '/dashboard/competitions', label: 'Competições', icon: '🏆' },
];

const adminItems = [
  { href: '/dashboard/admin/modalities', label: 'Modalidades', icon: '🎮' },
];

export async function Sidebar() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === 'admin';

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate border-r border-azure/10 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-azure/10">
        <Link href="/dashboard" className="flex flex-col items-center">
          <img
            src="/logo/athlon-padrao-sem-bg.png"
            alt="Athlon Logo"
            className="h-10 w-auto mb-1"
          />
          <p className="text-[10px] text-azure/50 tracking-[0.2em] uppercase font-bold">Competições</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-ice/60 hover:text-ice hover:bg-azure/10 transition-all group"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-4">
              <p className="text-[10px] text-azure/30 uppercase tracking-widest font-bold">Admin</p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-azure/50 hover:text-azure hover:bg-azure/10 transition-all group"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-azure/10">
        <p className="text-xs text-ice/20 text-center">© 2026 Athlon</p>
      </div>
    </aside>
  );
}
