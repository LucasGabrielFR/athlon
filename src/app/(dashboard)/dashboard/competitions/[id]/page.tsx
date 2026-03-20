import { auth } from '@/auth';
import { db } from '@/db';
import { competitions, competitionRegistrations, clubs, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { registerClubAction, approveRegistrationAction, deleteCompetitionAction, deactivateCompetitionAction } from '@/app/actions/competitions';
import Link from 'next/link';
import { ConfirmButton } from '@/components/confirm-button';
import { CompetitionFeed } from '@/components/competition-feed';
import { EditCompetitionDialog } from '@/components/edit-competition-dialog';
import { ManualStatusToggles } from '@/components/manual-status-toggles';
import { LayoutDashboard, MessageSquare, Settings, ShieldAlert, Users } from 'lucide-react';

export default async function CompetitionDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const compId = Number(id);
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, compId),
    with: { 
      modality: true,
      organization: true,
      organizer: true,
      posts: {
        with: { author: true },
        orderBy: [desc(competitions.createdAt)] // Actually we want desc posts, but drizzle query object syntax varies.
      }
    }
  });

  if (!comp) notFound();

  // Organizer or Admin?
  const isOrganizer = comp.organizerId === userId || comp.organization?.presidentId === userId || (session?.user as any)?.role === 'admin';

  // Club President?
  const userClubs = await db.query.clubs.findMany({
    where: eq(clubs.presidentId, userId),
  });

  // Current registration for this user's clubs
  const clubIds = userClubs.map(c => c.id);
  const myRegistrations = clubIds.length > 0 ? await db.query.competitionRegistrations.findMany({
    where: and(
      eq(competitionRegistrations.competitionId, compId),
    ),
    with: { club: true }
  }) : [];

  const registeredClubIds = myRegistrations.map(r => r.clubId);
  const eligibleClubs = userClubs.filter(c => !registeredClubIds.includes(c.id));

  // All registrations for organizers
  const allRegistrations = await db.query.competitionRegistrations.findMany({
    where: eq(competitionRegistrations.competitionId, compId),
    with: { club: true }
  });

  const isRegistrationOpen = comp.isRegistrationManualOpen || comp.status === 'registration';

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative h-72 rounded-[2rem] overflow-hidden border border-azure/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/60 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-1000"></div>
        
        <div className="absolute bottom-10 left-10 z-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] bg-azure text-slate px-3 py-1 rounded-lg font-black uppercase tracking-[0.2em] shadow-lg shadow-azure/20">{comp.modality?.name}</span>
            <span className="text-[10px] border border-ice/20 bg-slate/40 backdrop-blur-md text-ice px-3 py-1 rounded-lg font-black uppercase tracking-[0.2em]">{comp.format === 'knockout' ? 'Mata-mata' : 'Pontos Corridos'}</span>
          </div>
          <h1 className="text-5xl font-black text-ice tracking-tighter drop-shadow-2xl italic leading-none">{comp.name}</h1>
          <p className="text-ice/60 text-sm font-medium italic mt-3 flex items-center gap-2">
            Organizado por <span className="text-ice font-bold border-b border-azure/40">{comp.organization?.name || comp.organizer?.name || 'Independente'}</span>
          </p>
        </div>

        <div className="absolute top-10 right-10 z-20 flex gap-3">
          <div className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border transition-all ${
            isRegistrationOpen
              ? 'bg-azure text-slate border-azure shadow-[0_0_20px_rgba(0,163,255,0.4)] ring-4 ring-azure/10' 
              : 'bg-slate/40 backdrop-blur-md text-ice/40 border-ice/10'
          }`}>
            {isRegistrationOpen ? 'Inscrições Abertas' : 'Inscrições Encerradas'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-slate-dark/50 p-1.5 rounded-[1.5rem] border border-azure/10 w-fit">
        <Link 
          href={`?tab=overview`}
          className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest ${
            tab === 'overview' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
          }`}
        >
          <LayoutDashboard size={14} />
          Geral
        </Link>
        <Link 
          href={`?tab=feed`}
          className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest relative ${
            tab === 'feed' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
          }`}
        >
          <MessageSquare size={14} />
          Feed
          {comp.posts.length > 0 && tab !== 'feed' && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-slate animate-pulse" />
          )}
        </Link>
        {isOrganizer && (
          <Link 
            href={`?tab=settings`}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest ${
              tab === 'settings' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
            }`}
          >
            <Settings size={14} />
            Gestão
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {tab === 'overview' && (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Inscrição', value: comp.entryFee === 0 ? 'Grátis' : `$${comp.entryFee}`, color: 'text-azure' },
                  { label: 'Premiação', value: comp.prizePool === 0 ? '–' : `$${comp.prizePool}`, color: 'text-emerald-400' },
                  { label: 'Teams', value: `${allRegistrations.filter(r => r.status === 'approved').length} / ${comp.maxTeams || '∞'}`, color: 'text-ice' },
                  { label: 'Elenco', value: `${comp.minPlayersPerTeam}-${comp.maxPlayersPerTeam || '∞'}`, color: 'text-ice' }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate border border-azure/5 p-6 rounded-[2rem] group hover:border-azure/20 transition-all shadow-xl shadow-slate-dark/20 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-ice/20 uppercase font-black mb-1 border-b border-ice/10 w-full text-center pb-2 italic tracking-[0.2em]">{stat.label}</p>
                    <p className={`text-2xl font-black mt-2 ${stat.color} italic`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Registration Section for Club Presidents */}
              {eligibleClubs.length > 0 && isRegistrationOpen && (
                <div className="bg-gradient-to-br from-azure/20 via-azure/5 to-slate border border-azure/20 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,163,255,0.1)] relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <ShieldAlert size={200} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-ice mb-3 italic">Inscrever sua Equipe</h3>
                    <p className="text-ice/50 text-sm mb-8 max-w-md italic leading-relaxed">
                      Você é presidente de {eligibleClubs.length} clube(s) elegível(is). Escolha qual deseja inscrever nesta competição.
                    </p>
                    <form action={registerClubAction} className="flex flex-col sm:flex-row gap-4">
                      <input type="hidden" name="competitionId" value={compId} />
                      <select 
                        name="clubId"
                        className="bg-slate-dark/80 backdrop-blur-md border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all flex-1 appearance-none font-black italic text-xs uppercase tracking-widest"
                      >
                        {eligibleClubs.map(c => (
                          <option key={c.id} value={c.id} className="bg-slate">{c.name} [{c.tag}]</option>
                        ))}
                      </select>
                      <button 
                        type="submit"
                        className="bg-azure hover:bg-azure-dark text-slate font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-azure/20 uppercase tracking-[0.2em] text-[10px] italic"
                      >
                        Enviar Inscrição
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* My Registrations Status */}
              {myRegistrations.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.4em] px-2 italic">Status da sua Inscrição</h3>
                  <div className="grid gap-4">
                    {myRegistrations.map(reg => (
                      <div key={reg.id} className="bg-slate border border-azure/10 p-8 rounded-[2rem] flex items-center justify-between group hover:border-azure/20 transition-all shadow-lg">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 bg-azure rounded-full flex items-center justify-center font-black text-xl text-slate shadow-xl shadow-azure/10 group-hover:scale-105 transition-transform italic">{reg.club.tag}</div>
                          <div>
                            <h4 className="text-2xl font-black text-ice italic tracking-tighter leading-none">{reg.club.name}</h4>
                            <p className="text-[10px] text-ice/40 uppercase font-bold tracking-widest mt-2">Inscrito em {new Date(reg.createdAt!).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className={`text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest ${
                            reg.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                          }`}>
                            {reg.status === 'approved' ? '✓ Confirmado' : '⏳ Pendente'}
                          </span>
                          <Link 
                            href={`/dashboard/competitions/${compId}/roster?registrationId=${reg.id}`}
                            className="text-[10px] text-azure hover:text-ice font-black uppercase tracking-widest border-b border-azure/0 hover:border-ice transition-all"
                          >
                            Gerenciar Elenco →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'feed' && (
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.4em] px-2 italic">Feed de Atividades</h3>
              <CompetitionFeed 
                competitionId={compId} 
                posts={comp.posts as any} 
                isOrganizer={isOrganizer}
              />
            </div>
          )}

          {tab === 'settings' && isOrganizer && (
            <div className="space-y-10">
              <div className="bg-slate border border-azure/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                <div>
                  <h3 className="text-xl font-black text-ice italic">Ferramentas de Gerenciamento</h3>
                  <p className="text-xs text-ice/40 uppercase font-black tracking-widest mt-1">Controle total da competição</p>
                </div>

                <div className="grid gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-azure uppercase tracking-widest italic px-1">Ações do Torneio</p>
                    <div className="flex flex-wrap gap-4">
                      <EditCompetitionDialog competition={comp} />
                      <button 
                        disabled={comp.status !== 'registration'}
                        className="bg-azure hover:bg-azure-dark text-slate px-6 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-azure/10 disabled:opacity-20 italic"
                      >
                        Gerar Tabela & Iniciar Torneio
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-azure/5">
                    <p className="text-[10px] font-black text-azure uppercase tracking-widest italic px-1">Controles Manuais (Overrides)</p>
                    <ManualStatusToggles competition={comp} />
                    <p className="text-[9px] text-ice/20 italic">Os controles manuais sobrescrevem as datas programadas de inscrições e janelas.</p>
                  </div>
                </div>
              </div>

              {/* Pendentes */}
              <div className="bg-slate border border-azure/10 rounded-[2.5rem] p-10">
                <h3 className="text-[10px] font-black text-ice uppercase tracking-[0.4em] mb-6 italic">Inscrições Pendentes ({allRegistrations.filter(r => r.status === 'pending').length})</h3>
                <div className="grid gap-4">
                  {allRegistrations.filter(r => r.status === 'pending').map(reg => (
                    <div key={reg.id} className="flex items-center justify-between bg-slate-dark/50 p-6 rounded-2xl border border-azure/10 hover:border-azure/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <Users size={18} className="text-azure" />
                        <span className="text-sm text-ice font-black italic">{reg.club.name}</span>
                      </div>
                      <form action={approveRegistrationAction}>
                        <input type="hidden" name="registrationId" value={reg.id} />
                        <button className="text-[10px] bg-emerald-500 text-slate px-6 py-2 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 italic">Aprovar Equipe</button>
                      </form>
                    </div>
                  ))}
                  {allRegistrations.filter(r => r.status === 'pending').length === 0 && (
                    <div className="text-center py-10 opacity-20 italic text-sm">Nenhuma inscrição aguardando aprovação.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Dashboard Info */}
        <div className="space-y-8">
          <div className="bg-slate-dark/30 border border- ice/5 rounded-[2.5rem] p-8 shadow-xl">
            <h3 className="text-[10px] text-azure uppercase font-black tracking-[0.4em] mb-6 italic">Linha do Tempo</h3>
            <div className="space-y-8">
              {[
                { label: 'Fase de Inscrições', desc: 'Equipes podem ingressar e montar elencos.', active: isRegistrationOpen },
                { label: 'Janela de Transferência', desc: 'Troca de jogadores ativa.', active: comp.isWindowManualOpen },
                { label: 'Início da Competição', desc: 'Partidas e resultados oficiais.', active: comp.status === 'active' }
              ].map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      step.active 
                        ? 'bg-azure shadow-[0_0_15px_rgba(0,163,255,1)] ring-4 ring-azure/20 scale-125' 
                        : 'bg-ice/10 border border-ice/20'
                    }`} />
                    {i < 2 && <div className={`w-0.5 h-full my-1 transition-colors duration-500 ${step.active ? 'bg-azure/40' : 'bg-ice/5'}`} />}
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest italic ${step.active ? 'text-ice' : 'text-ice/20'}`}>{step.label}</p>
                    <p className={`text-[10px] mt-1 font-medium italic leading-relaxed ${step.active ? 'text-ice/60' : 'text-ice/10'}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate to-slate-dark border border-azure/5 rounded-[2.5rem] p-8">
            <h3 className="text-[10px] text-ice/40 uppercase font-black tracking-widest mb-4 italic">Organizador</h3>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-azure/10 rounded-xl flex items-center justify-center font-black text-azure italic">
                {comp.organization?.name?.[0] || comp.organizer?.name?.[0] || 'A'}
              </div>
              <div>
                <p className="text-sm font-black text-ice italic">{comp.organization?.name || comp.organizer?.name || 'Athlon Sport'}</p>
                <p className="text-[9px] text-ice/30 uppercase font-bold tracking-widest mt-1 italic">Ver Perfil da Org →</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone for Admins */}
      {(session?.user as any)?.role === 'admin' && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-10 max-w-4xl mx-auto mt-20 group hover:bg-red-500/[0.08] transition-all">
          <div className="flex items-center gap-4 mb-4">
            <ShieldAlert className="text-red-500" size={32} />
            <h3 className="text-2xl font-black text-red-500 italic uppercase tracking-tighter self-end">Painel Superior Administrador</h3>
          </div>
          <p className="text-ice/40 text-sm mb-10 max-w-2xl italic leading-relaxed">
            Funcionalidades de segurança crítica. A exclusão de uma competição é uma operação irreversível que limpará todos os registros de equipes, jogadores e estatísticas vinculados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <form action={deactivateCompetitionAction}>
              <input type="hidden" name="competitionId" value={compId} />
              <ConfirmButton 
                type="submit"
                confirmMessage={comp.status === 'deactivated' ? "Deseja REATIVAR esta competição?" : "Deseja DESATIVAR esta competição?"}
                className={`flex-1 bg-slate-dark hover:bg-slate border rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] px-10 py-4 italic ${
                  comp.status === 'deactivated' ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400/60 hover:text-red-400'
                }`}
              >
                {comp.status === 'deactivated' ? 'Reativar Competição' : 'Desativar Competição'}
              </ConfirmButton>
            </form>

            <form action={deleteCompetitionAction}>
              <input type="hidden" name="competitionId" value={compId} />
              <ConfirmButton 
                type="submit"
                confirmMessage="Você tem certeza que deseja EXCLUIR permanentemente esta competição? Todos os dados vinculados serão deletados para sempre."
                className="flex-1 bg-red-500 hover:bg-red-600 text-slate font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-red-500/20 text-[10px] uppercase tracking-[0.2em] italic"
              >
                Excluir Permanentemente
              </ConfirmButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

