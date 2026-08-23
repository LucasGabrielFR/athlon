/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/auth';
import { logoutAction } from '@/app/actions/auth';
import { fetchApi } from '@/lib/api';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

export async function Header() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = (session?.user as { role?: string })?.role;

  // Fetch active modality if user has a profile
  let activeModality: string | null = null;
  let userNotifications: any[] = [];
  
  if (userId) {
    try {
      const modalityRes = await fetchApi('/users/me/active-modality');
      if (modalityRes?.name) activeModality = modalityRes.name;

      const notifsRes = await fetchApi('/users/me/notifications?limit=10');
      if (Array.isArray(notifsRes)) userNotifications = notifsRes;
    } catch (e) {
      // silently ignore
    }
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-navy/80 backdrop-blur border-b border-azure/10 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-ice/40 text-sm">Bem-vindo,</span>
        <span className="text-ice font-semibold">{session?.user?.name ?? 'Atleta'}</span>
        {role && (
          <span className="text-xs bg-azure/10 text-azure border border-azure/20 px-2 py-0.5 rounded-full capitalize">
            {role.replace('_', ' ')}
          </span>
        )}
        {activeModality && (
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            🎮 {activeModality}
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <ThemeToggle />
        {userId && <NotificationBell initialNotifications={userNotifications} />}
        
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-ice/40 hover:text-red-400 transition-colors cursor-pointer"
          >
            Sair →
          </button>
        </form>
      </div>
    </header>
  );
}
