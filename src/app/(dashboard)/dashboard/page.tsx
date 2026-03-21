import { auth } from '@/auth';
import { db } from '@/db';
import { clubInvitations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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
  const pendingInvites = await db.query.clubInvitations.findMany({
    where: and(
      eq(clubInvitations.userId, userId),
      eq(clubInvitations.type, 'invite'),
      eq(clubInvitations.status, 'pending')
    ),
    with: { club: true }
  });

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-ice">
          Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice to-azure">{session?.user?.name?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-ice/40 mt-1">Bem-vindo ao seu painel de controle. O ecossistema competitivo te espera.</p>
      </div>

      {/* Notifications / Alerts */}
      {pendingInvites.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📨</span>
            <div>
              <p className="text-amber-400 font-bold text-sm">Você tem convite{pendingInvites.length > 1 ? 's' : ''} de clube!</p>
              <p className="text-amber-400/60 text-xs">Acesse a aba de Clubes para aceitar ou recusar.</p>
            </div>
          </div>
          <Link 
            href="/dashboard/clubs" 
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold px-3 py-1.5 rounded-lg transition-colors"
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
            className="bg-slate rounded-xl border border-azure/10 p-6 hover:border-azure/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-azure/50 bg-azure/5 px-2 py-0.5 rounded-full">{card.hint}</span>
            </div>
            <p className="text-3xl font-black text-ice group-hover:text-azure transition-colors">{card.value}</p>
            <p className="text-sm text-ice/40 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Phase Banner */}
      <div className="bg-slate rounded-xl border border-azure/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-emerald-400 uppercase tracking-widest font-semibold">Fase 6 iniciada</span>
        </div>
        <h3 className="text-ice font-bold text-lg">Estatísticas & Dashboards 📊</h3>
        <p className="text-ice/40 text-sm mt-1">
          Motor de Partidas Concluído ✅ &nbsp;|&nbsp; Súmulas Ativas ⚽ &nbsp;|&nbsp; Dashboards de Performance em desenvolvimento 🏗️
        </p>
      </div>
    </div>
  );
}
