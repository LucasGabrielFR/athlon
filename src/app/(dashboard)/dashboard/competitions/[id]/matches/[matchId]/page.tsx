import { auth } from '@/auth';
import { db } from '@/db';
import { matches, matchEvents, competitionRegistrations, users, clubs, statTypes, competitions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ChevronLeft, Clock, Play, CheckCircle2, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import { recordMatchEventAction, updateMatchStatusAction } from '@/app/actions/competitions';
import { MatchPolling } from '@/components/match-polling';
import { MatchEventForm } from '@/components/match-event-form';

export default async function MatchManagementPage({ 
  params 
}: { 
  params: Promise<{ id: string, matchId: string }> 
}) {
  const { id, matchId: mId } = await params;
  const compId = Number(id);
  const matchId = Number(mId);
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      competition: { 
        with: { 
          modality: { with: { statTypes: true } },
          organization: true 
        } 
      },
      homeRegistration: { with: { club: true, roster: { with: { user: true } } } },
      awayRegistration: { with: { club: true, roster: { with: { user: true } } } },
      events: { 
        with: { player: true, registration: { with: { club: true } } }, 
        orderBy: [desc(matchEvents.minute)] 
      }
    }
  });

  if (!match) notFound();

  if (!match.homeRegistration || !match.awayRegistration) {
      redirect(`/dashboard/competitions/${compId}?tab=bracket`);
  }

  const userRole = (session?.user as any)?.role || 'client';
  const isOrganizer = userId === match.competition.organizerId || 
                      userRole === 'admin' || 
                      (match.competition.organization && match.competition.organization.presidentId === userId);

  const isHomePresident = match.homeRegistration.club.presidentId === userId;
  const isAwayPresident = match.awayRegistration.club.presidentId === userId;

  if (!isOrganizer && !isHomePresident && !isAwayPresident) {
      redirect(`/dashboard/competitions/${compId}`);
  }

  const modStats = match.competition.modality?.statTypes ?? [];

  return (
    <div className="space-y-8 pb-20">
      <MatchPolling matchStatus={match.status} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          href={`/dashboard/competitions/${compId}?tab=matches`}
          className="group flex items-center gap-2 text-ice/40 hover:text-azure transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-slate border border-azure/10 flex items-center justify-center group-hover:border-azure/30">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest italic">Voltar para Tabela</span>
        </Link>

        <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-full border font-black text-[9px] uppercase tracking-[0.2em] italic ${
                match.status === 'live' ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' :
                match.status === 'finished' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                'bg-azure/10 border-azure/30 text-azure'
            }`}>
                {match.status === 'scheduled' ? 'Agendado' : match.status === 'live' ? '• Ao Vivo' : 'Finalizado'}
            </div>
        </div>
      </div>

      {/* Scoreboard Card */}
      <div className="relative bg-slate border-2 border-azure/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden min-h-[300px] flex items-center justify-center">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-azure/5 via-transparent to-transparent pointer-events-none" />
         
         <div className="relative grid grid-cols-1 md:grid-cols-3 items-center gap-12 w-full max-w-5xl">
            {/* Home */}
            <div className="space-y-6 text-center md:text-right order-2 md:order-1">
                <div className="inline-flex h-24 w-24 bg-slate-dark border-4 border-azure/10 rounded-3xl items-center justify-center text-3xl font-black text-ice/20 italic shadow-2xl">
                    {match.homeRegistration.club.tag}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-ice italic tracking-tighter">{match.homeRegistration.club.name}</h2>
                   <p className="text-[10px] text-azure font-black uppercase tracking-widest mt-1">Casa</p>
                </div>
            </div>

            {/* Middle: Score */}
            <div className="flex flex-col items-center justify-center space-y-4 order-1 md:order-2">
                <div className="flex items-center gap-8 font-black text-7xl italic tracking-tighter text-ice">
                    <span>{match.homeScore}</span>
                    <span className="text-xl text-azure/30 not-italic tracking-[0.5em] mx-2">VS</span>
                    <span>{match.awayScore}</span>
                </div>
                <div className="flex gap-4">
                   {match.status === 'scheduled' && (
                       <form action={async () => { 
                          "use server";
                          await updateMatchStatusAction(matchId, 'live'); 
                       }}>
                          <button className="bg-azure hover:bg-azure-dark text-slate px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2">
                             <Play className="w-4 h-4" /> Iniciar Partida
                          </button>
                       </form>
                   )}
                   {match.status === 'live' && (
                       <form action={async () => { 
                          "use server";
                          await updateMatchStatusAction(matchId, 'finished'); 
                       }}>
                          <button className="bg-green-500 hover:bg-green-600 text-slate px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4" /> Finalizar Partida
                          </button>
                       </form>
                   )}
                </div>
            </div>

            {/* Away */}
            <div className="space-y-6 text-center md:text-left order-3">
                <div className="inline-flex h-24 w-24 bg-slate-dark border-4 border-azure/10 rounded-3xl items-center justify-center text-3xl font-black text-ice/20 italic shadow-2xl">
                    {match.awayRegistration.club.tag}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-ice italic tracking-tighter">{match.awayRegistration.club.name}</h2>
                   <p className="text-[10px] text-azure font-black uppercase tracking-widest mt-1">Visitante</p>
                </div>
            </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Event Recording Form */}
          <div className="lg:col-span-1">
             <MatchEventForm 
                matchId={matchId}
                homeTeam={{
                   id: match.homeRegistrationId!,
                   name: match.homeRegistration.club.name,
                   roster: match.homeRegistration.roster.map(r => ({ userId: r.userId, name: r.user.name }))
                }}
                awayTeam={{
                   id: match.awayRegistrationId!,
                   name: match.awayRegistration.club.name,
                   roster: match.awayRegistration.roster.map(r => ({ userId: r.userId, name: r.user.name }))
                }}
                statTypes={modStats}
                compId={compId}
                manageableRegistrationIds={[
                    ...(isHomePresident || isOrganizer ? [match.homeRegistrationId!] : []),
                    ...(isAwayPresident || isOrganizer ? [match.awayRegistrationId!] : [])
                 ]}
                status={match.status}
             />
          </div>

          {/* Events Feed */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between px-4">
                <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.3em] flex items-center gap-3 italic">
                   <Clock className="w-3 h-3" /> Cronologia da Partida
                </h3>
             </div>

             <div className="space-y-4">
                {(match.events as any[]).map((event, idx) => (
                    <div key={event.id} className="relative bg-slate-dark/50 border border-azure/5 rounded-2xl p-6 flex items-center gap-6 group hover:border-azure/20 transition-all">
                       <div className="flex flex-col items-center">
                          <span className="text-xl font-black text-azure italic">{event.minute}&apos;</span>
                       </div>
                       
                       <div className="flex-1 flex items-center gap-4">
                          <div className={`h-1.5 w-1.5 rounded-full ${['gol', 'gols', 'kill', 'ponto'].includes(event.type.toLowerCase()) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-azure/50'}`} />
                          <div>
                             <p className="text-xs font-black text-ice italic">
                                {event.type.toUpperCase().replace('_', ' ')}
                             </p>
                             <p className="text-[10px] text-ice/40 font-black uppercase tracking-widest mt-0.5">
                                {event.player.name} ({event.registration.club.tag})
                             </p>
                          </div>
                       </div>

                       {idx < (match.events as any[]).length - 1 && (
                           <div className="absolute -bottom-4 left-9 w-[1px] h-4 bg-azure/10" />
                       )}
                    </div>
                ))}

                {(match.events as any[]).length === 0 && (
                   <div className="text-center py-20 border-2 border-dashed border-azure/5 rounded-[3rem]">
                      <AlertCircle className="w-8 h-8 text-azure/10 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-ice/20 uppercase tracking-widest italic">Aguardando eventos iniciais...</p>
                   </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
}
