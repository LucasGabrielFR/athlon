import { auth } from '@/auth';
import { db } from '@/db';
import { 
  competitions, 
  competitionRegistrations, 
  competitionRosters, 
  clubMembers,
  users 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { addToRosterAction, removeFromRosterAction } from '@/app/actions/competitions';
import { Trophy, ChevronLeft, Plus, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default async function RosterManagementPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ registrationId?: string }> 
}) {
  const { id } = await params;
  const { registrationId } = await searchParams;
  
  if (!registrationId) redirect(`/dashboard/competitions/${id}`);

  const compId = Number(id);
  const regId = Number(registrationId);
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, compId),
    with: { modality: true }
  });

  const reg = await db.query.competitionRegistrations.findFirst({
    where: eq(competitionRegistrations.id, regId),
    with: { club: true }
  });

  if (!comp || !reg) notFound();

  // Security check: Only club president or admin
  const isAdmin = (session?.user as any)?.role === 'admin';
  if (reg.club.presidentId !== userId && !isAdmin) {
    redirect(`/dashboard/competitions/${compId}`);
  }

  // Fetch current roster
  const currentRoster = await db.query.competitionRosters.findMany({
    where: eq(competitionRosters.registrationId, regId),
    with: { user: true }
  });

  const rosterUserIds = currentRoster.map(r => r.userId);

  // Fetch club members not in roster
  const allClubMembers = await db.query.clubMembers.findMany({
    where: eq(clubMembers.clubId, reg.clubId),
    with: { user: true }
  });

  const availablePlayers = allClubMembers.filter(m => !rosterUserIds.includes(m.userId));

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link 
        href={`/dashboard/competitions/${compId}`}
        className="text-azure hover:text-ice text-sm font-bold flex items-center gap-2 mb-8 transition-colors"
      >
        <span>←</span> Voltar para Competição
      </Link>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-azure/10 text-azure px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{reg.club.name}</span>
              <span className="text-[10px] bg-ice/5 text-ice/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Elenco Oficial</span>
            </div>
            <h2 className="text-3xl font-black text-ice tracking-tight">Gestão de <span className="text-azure">Inscritos</span></h2>
            <p className="text-ice/40 text-sm mt-1 italic">Competição: {comp.name} [{comp.modality?.name}]</p>
          </div>
          <div className="bg-slate-dark/30 border border-azure/20 px-4 py-2 rounded-xl">
             <p className="text-[10px] text-ice/30 uppercase font-black text-center mb-0.5">Vagas do Elenco</p>
             <p className={`text-xl font-black text-center ${currentRoster.length < (comp.minPlayersPerTeam || 1) ? 'text-amber-400' : 'text-emerald-400'}`}>
               {currentRoster.length} / {comp.maxPlayersPerTeam || '∞'}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Roster */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-ice uppercase tracking-[0.2em] px-1 flex items-center justify-between">
              Time Inscrito
              <span className="text-[10px] text-ice/20 font-normal normal-case">Mínimo necessário: {comp.minPlayersPerTeam}</span>
            </h3>
            <div className="bg-slate border border-emerald-500/10 rounded-2xl p-4 min-h-[300px] space-y-3">
              {currentRoster.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <span className="text-4xl opacity-10 mb-2">🏃‍♂️</span>
                  <p className="text-ice/20 text-xs italic">Nenhum jogador escalado para este torneio ainda.</p>
                </div>
              ) : (
                currentRoster.map(rosterItem => (
                  <div key={rosterItem.id} className="flex items-center justify-between bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 group">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-400">
                        {rosterItem.user?.nickname?.substring(0,2).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p className="text-ice font-bold text-sm">{rosterItem.user?.name}</p>
                        <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">{rosterItem.user?.nickname}</p>
                      </div>
                    </div>
                    <form action={removeFromRosterAction}>
                      <input type="hidden" name="registrationId" value={regId} />
                      <input type="hidden" name="targetUserId" value={rosterItem.userId} />
                      <button className="text-ice/20 hover:text-red-500 p-2 rounded-lg transition-colors flex items-center gap-2 group/btn">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover/btn:opacity-100 transition-all transform translate-x-2 group-hover/btn:translate-x-0">Retirar</span>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Players */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-ice uppercase tracking-[0.2em] px-1">Escalar Jogadores</h3>
            <div className="bg-slate border border-azure/10 rounded-2xl p-4 min-h-[300px] space-y-3">
              {availablePlayers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <span className="text-4xl opacity-10 mb-2">📋</span>
                  <p className="text-ice/20 text-xs italic">Todos os membros do clube já foram escalados ou o clube está vazio.</p>
                </div>
              ) : (
                availablePlayers.map(member => (
                  <div key={member.id} className="flex items-center justify-between bg-slate-dark/50 p-4 rounded-xl border border-azure/5 hover:border-azure/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-azure/10 rounded-full"></div>
                      <div>
                        <p className="text-ice font-bold text-sm">{member.user?.name}</p>
                        <p className="text-[10px] text-azure/40 font-black uppercase tracking-widest">{member.user?.nickname}</p>
                      </div>
                    </div>
                    <form action={addToRosterAction}>
                      <input type="hidden" name="registrationId" value={regId} />
                      <input type="hidden" name="targetUserId" value={member.userId} />
                      <button 
                        disabled={comp.maxPlayersPerTeam ? currentRoster.length >= comp.maxPlayersPerTeam : false}
                        className="bg-azure/10 hover:bg-azure text-azure hover:text-slate p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:scale-110"
                      >
                         <span className="font-black text-xs">➕ Escalar</span>
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Requirements Alert */}
        {currentRoster.length < (comp.minPlayersPerTeam || 1) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="text-amber-400 font-black text-sm uppercase tracking-widest">Elenco Incompleto</p>
              <p className="text-amber-400/60 text-[10px] italic">Sua equipe precisa de pelo menos {comp.minPlayersPerTeam} jogadores escalados para ser validada na competição.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
