import { auth } from '@/auth';

const statCards = [
  { label: 'Modalidades', value: '–', icon: '🎮', hint: 'Em breve' },
  { label: 'Clubes Ativos', value: '–', icon: '🛡️', hint: 'Em breve' },
  { label: 'Competições', value: '–', icon: '🏆', hint: 'Em breve' },
  { label: 'Partidas Jogadas', value: '–', icon: '⚽', hint: 'Em breve' },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-ice">
          Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice to-azure">{session?.user?.name?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-ice/40 mt-1">Bem-vindo ao seu painel de controle. O ecossistema competitivo te espera.</p>
      </div>

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
          <span className="text-xs text-emerald-400 uppercase tracking-widest font-semibold">Fase 1 em progresso</span>
        </div>
        <h3 className="text-ice font-bold text-lg">Fundação & Infraestrutura</h3>
        <p className="text-ice/40 text-sm mt-1">
          Autenticação implementada ✅ &nbsp;|&nbsp; RBAC configurado ✅ &nbsp;|&nbsp; Layout base no ar ✅
        </p>
      </div>
    </div>
  );
}
