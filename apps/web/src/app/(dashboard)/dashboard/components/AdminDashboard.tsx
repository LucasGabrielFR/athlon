import Link from 'next/link';

export function AdminDashboard({ data }: { data: any }) {
  const statCards = [
    { label: 'Organizações', value: data.overview.organizations, icon: '🏛️' },
    { label: 'Clubes', value: data.overview.clubs, icon: '🛡️' },
    { label: 'Jogadores', value: data.overview.users, icon: '👤' },
    { label: 'Competições', value: data.overview.competitions, icon: '🏆' },
    { label: 'Partidas Totais', value: data.overview.matches, icon: '⚽' },
    { label: 'Modalidades Ativas', value: data.overview.modalities, icon: '🎮' },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-slate rounded-xl border border-azure/20 p-4 hover:border-azure/50 transition-colors relative overflow-hidden"
          >
            <div className="absolute -right-2 -top-2 w-12 h-12 bg-azure/10 dark:bg-azure/5 rounded-full blur-xl"></div>
            <div className="text-xl mb-2">{card.icon}</div>
            <p className="text-2xl font-black text-ice group-hover:text-azure transition-colors">{card.value}</p>
            <p className="text-xs text-ice/60 uppercase tracking-wider font-semibold">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Modalities */}
        <div className="bg-slate rounded-xl border border-azure/20 p-6">
          <h3 className="text-ice font-bold text-lg mb-4 flex items-center gap-2">
            <span>🔥</span> Modalidades Mais Usadas
          </h3>
          <div className="space-y-3">
            {data.topModalities?.length === 0 ? (
              <p className="text-ice/60 text-sm">Nenhuma partida registrada ainda.</p>
            ) : (
              data.topModalities?.map((mod: any, index: number) => (
                <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-dark border border-ice/10">
                  <div className="flex items-center gap-3">
                    <span className="text-azure/60 font-black">#{index + 1}</span>
                    <span className="text-ice font-bold text-sm">{mod.name}</span>
                  </div>
                  <div className="text-xs font-bold bg-azure/10 text-azure px-2 py-1 rounded">
                    {mod.matchCount} Partidas
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate rounded-xl border border-emerald-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">Status do Ecossistema</span>
          </div>
          <p className="text-ice/70 text-sm mb-4">O motor de agendamento de partidas e resultados está rodando perfeitamente. Todos os sistemas operacionais.</p>
          <div className="p-4 bg-slate-dark rounded-lg border border-ice/10 mt-auto">
            <p className="text-xs text-ice/60">Última atualização: Agora</p>
          </div>
        </div>
      </div>
    </div>
  );
}
