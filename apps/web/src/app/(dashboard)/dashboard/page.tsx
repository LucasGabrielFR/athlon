import { auth } from '@/auth';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

const statCards = [
  { label: 'Modalidades', value: '–', icon: '🎮', hint: 'Em breve' },
  { label: 'Clubes Ativos', value: '–', icon: '🛡️', hint: 'Em breve' },
  { label: 'Competições', value: '–', icon: '🏆', hint: 'Em breve' },
  { label: 'Partidas Jogadas', value: '–', icon: '⚽', hint: 'Em breve' },
];

export default async function DashboardPage() {
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  // Fetch pending invitations for the user
  const pendingInvites = await fetchApi('/users/me/invitations/pending') || [];
  
  // Fetch platform stats
  const stats = await fetchApi('/stats/overview') || { modalities: 0, clubs: 0, competitions: 0, matches: 0 };

  // Fetch user clubs
  const memberships = await fetchApi('/users/me/memberships') || [];

  const statCards = [
    { label: 'Modalidades Ativas', value: stats.modalities || '0', icon: '🎮' },
    { label: 'Clubes Ativos', value: stats.clubs || '0', icon: '🛡️' },
    { label: 'Competições', value: stats.competitions || '0', icon: '🏆' },
    { label: 'Partidas Registradas', value: stats.matches || '0', icon: '⚽' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-ice">
          Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice to-azure">{session?.user?.name?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-ice/60 mt-1">Bem-vindo ao seu painel de controle. O ecossistema competitivo te espera.</p>
      </div>

      {/* Notifications / Alerts */}
      {pendingInvites.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📨</span>
            <div>
              <p className="text-amber-500 dark:text-amber-400 font-bold text-sm">Você tem convite{pendingInvites.length > 1 ? 's' : ''} de clube!</p>
              <p className="text-amber-600/80 dark:text-amber-400/60 text-xs">Acesse a aba de Clubes para aceitar ou recusar.</p>
            </div>
          </div>
          <Link 
            href="/dashboard/clubs" 
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver Convites
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-slate rounded-xl border border-azure/20 p-6 hover:border-azure/50 transition-colors group relative overflow-hidden shadow-sm shadow-azure/5"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-azure/10 dark:bg-azure/5 rounded-full group-hover:bg-azure/20 dark:group-hover:bg-azure/10 transition-colors blur-xl"></div>
            <div className="flex items-center justify-between mb-4 relative">
              <span className="text-2xl drop-shadow-sm">{card.icon}</span>
            </div>
            <p className="text-3xl font-black text-ice group-hover:text-azure transition-colors relative">{card.value}</p>
            <p className="text-sm text-ice/60 mt-1 uppercase tracking-wider font-semibold relative">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Updates & News */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm shadow-azure/5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">Fase 6: Novidades da Plataforma</span>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-dark rounded-lg border border-ice/10">
                <h3 className="text-ice font-bold text-lg mb-1">Estatísticas & Dashboards 📊</h3>
                <p className="text-ice/70 text-sm">
                  O Motor de Partidas está operante. Agora você pode visualizar estatísticas gerais acima. Dashboards avançados de performance individual estão em desenvolvimento.
                </p>
              </div>
              <div className="p-4 bg-slate-dark rounded-lg border border-ice/10">
                <h3 className="text-ice font-bold text-lg mb-1">Mercado de Transferências ⚽</h3>
                <p className="text-ice/70 text-sm">
                  O painel de mercado agora conta com filtros completos de modalidade e posição. Clubes e jogadores já podem gerenciar seus elencos ativamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Quick Access */}
        <div className="space-y-6">
          <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm shadow-azure/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-ice font-bold text-lg">Meus Clubes</h3>
              <Link href="/dashboard/clubs" className="text-azure text-xs font-semibold hover:underline">Ver todos</Link>
            </div>
            
            {memberships.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-ice/60 text-sm mb-4">Você ainda não participa de nenhum clube.</p>
                <Link href="/dashboard/clubs" className="inline-block bg-azure/10 text-azure hover:bg-azure/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-azure/20">
                  Procurar Clubes
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {memberships.slice(0, 4).map((m: any) => (
                  <Link href={`/dashboard/clubs/${m.club.id}`} key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-azure/30 hover:bg-slate-dark transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-dark border border-azure/30 overflow-hidden flex items-center justify-center shrink-0">
                      {m.club.logoUrl ? (
                        <img src={m.club.logoUrl} alt={m.club.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-ice/50 font-bold text-xs">{m.club.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ice truncate">{m.club.name}</p>
                      <p className="text-xs text-azure truncate font-medium">{m.modality?.name || 'Clube'}</p>
                    </div>
                    <div className="text-xs font-bold text-ice/60 bg-slate-dark border border-ice/10 px-2 py-1 rounded">
                      {m.status === 'active' ? 'Ativo' : m.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
