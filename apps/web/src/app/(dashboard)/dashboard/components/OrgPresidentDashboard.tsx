import Link from 'next/link';

export function OrgPresidentDashboard({ data }: { data: any }) {
  const statCards = [
    { label: 'Competições Ativas', value: data.activeCompetitions || 0, icon: '🔥' },
    { label: 'Competições Finalizadas', value: data.finishedCompetitions || 0, icon: '✅' },
    { label: 'Clubes Únicos Participantes', value: data.totalClubsParticipated || 0, icon: '🛡️' },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-slate rounded-xl border border-azure/20 p-6 hover:border-azure/50 transition-colors relative overflow-hidden shadow-sm"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-azure/10 dark:bg-azure/5 rounded-full blur-xl"></div>
            <div className="flex items-center gap-4">
              <span className="text-3xl drop-shadow-sm">{card.icon}</span>
              <div>
                <p className="text-3xl font-black text-ice">{card.value}</p>
                <p className="text-xs text-ice/60 uppercase tracking-wider font-semibold">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-ice">Minhas Organizações</h3>
        </div>
        
        {data.organizations?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ice/60 mb-4">Você ainda não gerencia nenhuma organização.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.organizations?.map((org: any) => (
              <div key={org.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-dark border border-ice/10 items-center">
                <div className="w-20 h-20 rounded-xl bg-slate border border-azure/30 flex items-center justify-center overflow-hidden shrink-0">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-ice/50 font-black text-2xl">{org.tag}</span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-lg font-bold text-ice">{org.name}</h4>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="text-xs font-bold text-azure bg-azure/10 px-2 py-1 rounded">Tag: {org.tag}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-ice/10 text-ice/60'}`}>
                      {org.status === 'active' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/organizations/${org.id}`} className="w-full sm:w-auto px-6 py-2 bg-azure hover:bg-azure/90 text-slate-dark font-black rounded-lg transition-colors text-center text-sm">
                  Painel da Org
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
