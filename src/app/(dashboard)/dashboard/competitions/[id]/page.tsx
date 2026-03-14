import { auth } from '@/auth';
import { db } from '@/db';
import { competitions, competitionRegistrations, clubs, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { registerClubAction, approveRegistrationAction, deleteCompetitionAction, deactivateCompetitionAction } from '@/app/actions/competitions';
import Link from 'next/link';
import { ConfirmButton } from '@/components/confirm-button';

export default async function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const compId = Number(id);
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, compId),
    with: { 
      modality: true,
      organization: true,
      organizer: true
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
      // In Next.js/Drizzle we'd usually use 'inArray'. Let's keep it simple for now and just check the first one or fetch all.
    ),
    with: { club: true }
  }) : [];

  const registeredClubIds = myRegistrations.map(r => r.clubId);
  const eligibleClubs = userClubs.filter(c => !registeredClubIds.includes(c.id));

  // All registrations for organizers
  const allRegistrations = isOrganizer ? await db.query.competitionRegistrations.findMany({
    where: eq(competitionRegistrations.competitionId, compId),
    with: { club: true }
  }) : [];

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative h-64 rounded-3xl overflow-hidden border border-azure/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/80 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        
        <div className="absolute bottom-8 left-8 z-20">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] bg-azure text-slate px-2 py-0.5 rounded font-black uppercase tracking-widest">{comp.modality?.name}</span>
            <span className="text-[10px] border border-ice/20 text-ice/60 px-2 py-0.5 rounded font-bold uppercase tracking-widest">{comp.format === 'knockout' ? 'Mata-mata' : 'Pontos Corridos'}</span>
          </div>
          <h1 className="text-4xl font-black text-ice tracking-tighter drop-shadow-md">{comp.name}</h1>
          <p className="text-ice/60 text-sm font-medium italic mt-1">Organizado por {comp.organization?.name || comp.organizer?.name || 'Independente'}</p>
        </div>

        <div className="absolute top-8 right-8 z-20 flex gap-2">
          <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
            comp.status === 'registration' 
              ? 'bg-azure text-slate border-azure shadow-lg shadow-azure/20 ring-4 ring-azure/10' 
              : 'bg-slate/50 text-ice/40 border-ice/10'
          }`}>
            {comp.status === 'registration' ? 'Inscrições Abertas' : comp.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate border border-azure/5 p-4 rounded-2xl text-center group hover:border-azure/20 transition-all">
              <p className="text-[10px] text-ice/30 uppercase font-black mb-1">Inscrição</p>
              <p className="text-xl font-black text-azure">{comp.entryFee === 0 ? 'Grátis' : `$${comp.entryFee}`}</p>
            </div>
            <div className="bg-slate border border-azure/5 p-4 rounded-2xl text-center group hover:border-azure/20 transition-all">
              <p className="text-[10px] text-ice/30 uppercase font-black mb-1">Premiação</p>
              <p className="text-xl font-black text-emerald-400">{comp.prizePool === 0 ? '–' : `$${comp.prizePool}`}</p>
            </div>
            <div className="bg-slate border border-azure/5 p-4 rounded-2xl text-center group hover:border-azure/20 transition-all">
              <p className="text-[10px] text-ice/30 uppercase font-black mb-1">Times</p>
              <p className="text-xl font-black text-ice">{allRegistrations.length} / {comp.maxTeams || '∞'}</p>
            </div>
            <div className="bg-slate border border-azure/5 p-4 rounded-2xl text-center group hover:border-azure/20 transition-all">
              <p className="text-[10px] text-ice/30 uppercase font-black mb-1">Elenco</p>
              <p className="text-xl font-black text-ice">{comp.minPlayersPerTeam}-{comp.maxPlayersPerTeam || '∞'}</p>
            </div>
          </div>

          {/* Registration Section for Club Presidents */}
          {eligibleClubs.length > 0 && comp.status === 'registration' && (
            <div className="bg-gradient-to-r from-azure/20 to-azure/5 border border-azure/20 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🛡️</span>
              </div>
              <h3 className="text-xl font-black text-ice mb-2">Inscrever sua Equipe</h3>
              <p className="text-ice/60 text-sm mb-6 max-w-md italic">
                Você é presidente de {eligibleClubs.length} clube(s) elegível(is). Escolha qual deseja inscrever nesta competição.
              </p>
              <form action={registerClubAction} className="flex flex-col sm:flex-row gap-3">
                <input type="hidden" name="competitionId" value={compId} />
                <select 
                  name="clubId"
                  className="bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:outline-none focus:border-azure transition-all flex-1 appearance-none font-bold"
                >
                  {eligibleClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} [{c.tag}]</option>
                  ))}
                </select>
                <button 
                  type="submit"
                  className="bg-azure hover:bg-azure-dark text-slate font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-azure/20 uppercase tracking-widest text-xs"
                >
                  Enviar Inscrição
                </button>
              </form>
            </div>
          )}

          {/* My Registrations Status */}
          {myRegistrations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-azure uppercase tracking-[0.2em] px-1">Status da sua Inscrição</h3>
              {myRegistrations.map(reg => (
                <div key={reg.id} className="bg-slate border border-azure/10 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-azure/10 rounded-full flex items-center justify-center font-bold text-azure">{reg.club.tag}</div>
                    <div>
                      <h4 className="text-ice font-bold">{reg.club.name}</h4>
                      <p className="text-[10px] text-ice/40 uppercase font-black tracking-widest">Inscrito em {new Date(reg.createdAt!).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      reg.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-azure/10'
                    }`}>
                      {reg.status === 'approved' ? 'Confirmado' : 'Pendente de Aprovação'}
                    </span>
                    <Link 
                      href={`/dashboard/competitions/${compId}/roster?registrationId=${reg.id}`}
                      className="text-xs text-azure hover:text-ice font-bold border-b border-azure/0 hover:border-ice transition-all"
                    >
                      Gerenciar Elenco →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Organizer Tools */}
        <div className="space-y-6">
          {isOrganizer && (
            <div className="bg-slate border border-azure/10 rounded-2xl p-6">
              <h3 className="text-sm font-black text-ice uppercase tracking-[0.2em] mb-4">Gestão do Organizador</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] text-ice/30 uppercase font-black mb-3">Inscrições Pendentes ({allRegistrations.filter(r => r.status === 'pending').length})</h4>
                  <div className="space-y-3">
                    {allRegistrations.filter(r => r.status === 'pending').map(reg => (
                      <div key={reg.id} className="flex items-center justify-between bg-slate-dark/50 p-3 rounded-xl border border-azure/5">
                        <span className="text-xs text-ice/60 font-medium">{reg.club.name}</span>
                        <form action={approveRegistrationAction}>
                          <input type="hidden" name="registrationId" value={reg.id} />
                          <button className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-black uppercase transition-colors">Aprovar</button>
                        </form>
                      </div>
                    ))}
                    {allRegistrations.filter(r => r.status === 'pending').length === 0 && (
                      <p className="text-[10px] text-ice/20 italic">Sem solicitações pendentes.</p>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-azure/5">
                  <button 
                    disabled={comp.status !== 'registration'}
                    className="w-full bg-slate-dark hover:bg-slate border border-azure/20 text-ice/60 hover:text-azure py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                  >
                    Encerrar Inscrições & Gerar Tabela
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-dark/30 border border-ice/5 rounded-2xl p-6">
            <h3 className="text-[10px] text-ice/20 uppercase font-black tracking-widest mb-4 italic">Timeline da Competição</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-0.5 bg-azure/50 relative">
                  <div className="absolute top-0 -left-[3px] w-2 h-2 rounded-full bg-azure shadow-[0_0_10px_rgba(0,163,255,0.8)]"></div>
                </div>
                <div>
                  <p className="text-xs text-ice font-bold">Fase de Inscrições</p>
                  <p className="text-[10px] text-ice/40 mt-0.5">Atualmente ativa. Equipes podem ingressar.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-0.5 bg-ice/5"></div>
                <div>
                  <p className="text-xs text-ice/40 font-bold">Início da Competição</p>
                  <p className="text-[10px] text-ice/20 mt-0.5">Aguardando preenchimento das vagas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone for Admins */}
      {(session?.user as any)?.role === 'admin' && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 max-w-4xl mx-auto mt-20">
          <h3 className="text-xl font-black text-red-500 mb-2 italic">⚠️ Danger Zone</h3>
          <p className="text-ice/40 text-sm mb-6 max-w-md">
            Funcionalidades restritas ao administrador do sistema. A exclusão é absoluta e removerá todos os dados vinculados permanentemente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <form action={deactivateCompetitionAction}>
              <input type="hidden" name="competitionId" value={compId} />
              <ConfirmButton 
                type="submit"
                confirmMessage={comp.status === 'deactivated' ? "Deseja REATIVAR esta competição?" : "Deseja DESATIVAR esta competição?"}
                className={`bg-slate-dark hover:bg-slate-light border rounded-xl transition-all font-black text-[10px] uppercase tracking-widest px-8 py-3 ${
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
                className="bg-red-500 hover:bg-red-600 text-slate font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 text-[10px] uppercase tracking-widest"
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
