import { auth } from '@/auth';
import { db } from '@/db';
import { competitions, competitionRegistrations, clubs, users, competitionPosts, matches, matchPlayerStats } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { registerClubAction, approveRegistrationAction, deleteCompetitionAction, deactivateCompetitionAction, generateMatchesAction, validateMatchAction } from '@/app/actions/competitions';
import Link from 'next/link';
import { ConfirmButton } from '@/components/confirm-button';
import { CompetitionFeed } from '@/components/competition-feed';
import { EditCompetitionDialog } from '@/components/edit-competition-dialog';
import { ManualStatusToggles } from '@/components/manual-status-toggles';
import { StartTournamentButton } from '@/components/start-tournament-button';
import { StandingsTable, type TeamStanding } from '@/components/standings-table';
import { KnockoutBracket } from '@/components/knockout-bracket';
import { CompetitionStatistics } from '@/components/competition-statistics';
import { LayoutDashboard, MessageSquare, Settings, ShieldAlert, Users, ChevronRight, Trophy, Calendar, ListOrdered, CheckCheck, BarChart3 } from 'lucide-react';

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
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = role === 'admin';

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, compId),
    with: { 
      modality: true,
      organization: true,
      organizer: true,
      posts: {
        with: { 
          author: true,
          comments: {
            with: { author: true },
            orderBy: (c, { asc }) => [asc(c.createdAt)]
          },
          reactions: true
        },
        orderBy: [desc(competitionPosts.createdAt)]
      },
      matches: {
        with: {
          homeRegistration: { with: { club: true } },
          awayRegistration: { with: { club: true } }
        },
        orderBy: [desc(matches.round)]
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
      inArray(competitionRegistrations.clubId, clubIds)
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

  // Calculate Standings (only if not pure knockout)
  const standingsMap = new Map<number, TeamStanding>();
  let allStandings: any[] = [];
  let groups: string[] = [];

  if (comp.format !== 'knockout') {
    // Initialize teams
    allRegistrations.forEach(reg => {
      standingsMap.set(reg.clubId, {
        clubId: reg.clubId,
        name: reg.club.name,
        tag: reg.club.tag,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      });
    });

    const groupsConfig = (comp.groupsConfig as any) || {};
    const ptsPerWin = groupsConfig.pointsPerWin ?? 3;
    const ptsPerDraw = groupsConfig.pointsPerDraw ?? 1;
    const ptsPerLoss = groupsConfig.pointsPerLoss ?? 0;
    const tieBreakers = groupsConfig.tieBreakerOrder || ['pts', 'wins', 'goalDiff', 'goalsFor'];

    comp.matches.forEach(match => {
      if (match.status !== 'finished' || match.stage === 'knockout' || (comp.requiresValidation && !match.isValidated)) return;
      const home = match.homeRegistration ? standingsMap.get(match.homeRegistration.clubId) : undefined;
      const away = match.awayRegistration ? standingsMap.get(match.awayRegistration.clubId) : undefined;
      if (home && away) {
        home.played++; away.played++;
        const hs = match.homeScore ?? 0;
        const as = match.awayScore ?? 0;
        home.goalsFor += hs; home.goalsAgainst += as;
        away.goalsFor += as; away.goalsAgainst += hs;
        if (hs > as) {
          home.points += ptsPerWin; home.wins++; away.points += ptsPerLoss; away.losses++;
        } else if (as > hs) {
          away.points += ptsPerWin; away.wins++; home.points += ptsPerLoss; home.losses++;
        } else {
          home.points += ptsPerDraw; away.points += ptsPerDraw; home.draws++; away.draws++;
        }
      }
    });

    allStandings = Array.from(standingsMap.values()).map(s => {
      const reg = allRegistrations.find(r => r.clubId === s.clubId);
      return {
        ...s,
        groupId: reg?.groupId || 'A',
        goalDifference: s.goalsFor - s.goalsAgainst
      };
    }).sort((a, b) => {
      for (const t of tieBreakers) {
        if (t === 'pts' && b.points !== a.points) return b.points - a.points;
        if (t === 'wins' && b.wins !== a.wins) return b.wins - a.wins;
        if (t === 'goalDiff' && b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (t === 'goalsFor' && b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      }
      return 0;
    });

    groups = Array.from(new Set(allStandings.map(s => s.groupId))).sort() as string[];
  }

  // --- Phase 6: Statistics Calculation ---
  const matchIds = comp.matches.map(m => m.id);
  const allStats = matchIds.length > 0 ? await db.query.matchPlayerStats.findMany({
    where: inArray(matchPlayerStats.matchId, matchIds),
    with: {
      player: true,
      registration: { with: { club: true } }
    }
  }) : [];

  const playerAggregation = new Map<number, { 
    name: string, 
    tag: string, 
    clubName: string, 
    goals: number, 
    assists: number, 
    saves: number, 
    ratings: number[],
    count: number 
  }>();

  allStats.forEach(s => {
    const existing = playerAggregation.get(s.playerId) || { 
      name: s.player.name || 'Unknown', 
      tag: (s.registration as any)?.club?.tag || '?', 
      clubName: (s.registration as any)?.club?.name || '?',
      goals: 0, assists: 0, saves: 0, ratings: [] as number[], count: 0 
    };
    
    existing.goals += s.goals || 0;
    existing.assists += s.assists || 0;
    existing.saves += s.saves || 0;
    if (s.rating) existing.ratings.push(s.rating);
    existing.count++;
    
    playerAggregation.set(s.playerId, existing);
  });

  const topScorers = Array.from(playerAggregation.entries())
    .map(([id, data]) => ({ id, name: data.name, tag: data.tag, clubName: data.clubName, value: data.goals }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topAssisters = Array.from(playerAggregation.entries())
    .map(([id, data]) => ({ id, name: data.name, tag: data.tag, clubName: data.clubName, value: data.assists }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topMVPs = Array.from(playerAggregation.entries())
    .map(([id, data]) => ({ 
      id, 
      name: data.name, 
      tag: data.tag, 
      clubName: data.clubName, 
      value: data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) : 0 
    }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topGoalkeepers = Array.from(playerAggregation.entries())
    .map(([id, data]) => ({ id, name: data.name, tag: data.tag, clubName: data.clubName, value: data.saves }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative h-72 rounded-[2rem] overflow-hidden border border-azure/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/60 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-1000"></div>
        
        <div className="absolute bottom-10 left-10 z-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] bg-azure text-slate px-3 py-1 rounded-lg font-black uppercase tracking-[0.2em] shadow-lg shadow-azure/20">{comp.modality?.name}</span>
            <span className="text-[10px] border border-ice/20 bg-slate/40 backdrop-blur-md text-ice px-3 py-1 rounded-lg font-black uppercase tracking-[0.2em]">
              {comp.format === 'knockout' ? 'Mata-mata' : comp.format === 'groups_knockout' ? 'Grupos + Mata-mata' : 'Pontos Corridos'}
            </span>
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
        {comp.status === 'active' && (
          <Link 
            href={`?tab=matches`}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest ${
              tab === 'matches' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
            }`}
          >
            <Users size={14} />
            Partidas
          </Link>
        )}
        {comp.status === 'active' && comp.format !== 'knockout' && (
          <Link 
            href={`?tab=classification`}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest ${
              tab === 'classification' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
            }`}
          >
            <ListOrdered size={14} />
            Classificação
          </Link>
        )}
        {comp.status === 'active' && (comp.format === 'knockout' || comp.format === 'groups_knockout') && (
          <Link 
            href={`?tab=bracket`}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest ${
              tab === 'bracket' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
            }`}
          >
            <Trophy size={14} />
            Mata-Mata
          </Link>
        )}
        {comp.status === 'active' && (
          <Link 
            href={`?tab=stats`}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1rem] transition-all font-black text-[10px] uppercase tracking-widest ${
              tab === 'stats' ? 'bg-azure text-slate shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice hover:bg-slate-dark'
            }`}
          >
            <BarChart3 size={14} />
            Estatísticas
          </Link>
        )}
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
                  <div key={i} className="bg-slate border border-azure/5 p-6 rounded-[2rem] group hover:border-azure/20 transition-all shadow-xl shadow-slate-dark/20 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-ice/20 uppercase font-black mb-1 border-b border-ice/10 w-full pb-2 italic tracking-[0.2em]">{stat.label}</p>
                    <p className={`text-2xl font-black mt-2 ${stat.color} italic`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Equipes Participantes */}
              {allRegistrations.filter(r => r.status === 'approved').length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.4em] italic leading-none">Equipes Participantes</h3>
                    <span className="text-[10px] font-black text-ice/20 uppercase tracking-widest">{allRegistrations.filter(r => r.status === 'approved').length} Equipes</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {allRegistrations.filter(r => r.status === 'approved').map(reg => {
                      const isMine = clubIds.includes(reg.clubId);
                      return (
                        <div key={reg.id} className="bg-slate border border-azure/10 p-8 rounded-[2rem] flex items-center justify-between group hover:border-azure/20 transition-all shadow-lg">
                          <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-azure rounded-full flex items-center justify-center font-black text-xl text-slate shadow-xl shadow-azure/10 group-hover:scale-105 transition-transform italic">{reg.club.tag}</div>
                            <div>
                              <h4 className="text-2xl font-black text-ice italic tracking-tighter leading-none">{reg.club.name}</h4>
                              <p className="text-[10px] text-ice/40 uppercase font-bold tracking-widest mt-2 italic">Confirmado em {new Date(reg.updatedAt!).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <Link 
                            href={`/dashboard/competitions/${compId}/roster?registrationId=${reg.id}`}
                            className="text-[10px] text-azure hover:text-ice font-black uppercase tracking-widest border-b border-azure/0 hover:border-ice transition-all"
                          >
                            {isMine ? 'Gerenciar Elenco →' : 'Ver Elenco →'}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* Suas Inscrições Pendentes */}
              {myRegistrations.filter(r => r.status === 'pending').length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.4em] px-2 italic">Status da sua Inscrição</h3>
                  <div className="grid gap-4">
                    {myRegistrations.filter(r => r.status === 'pending').map(reg => (
                      <div key={reg.id} className="bg-slate border border-amber-500/10 p-8 rounded-[2rem] flex items-center justify-between group hover:border-amber-500/20 transition-all shadow-lg">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 bg-amber-500 rounded-full flex items-center justify-center font-black text-xl text-slate shadow-xl shadow-amber-500/10 group-hover:scale-105 transition-transform italic">{reg.club.tag}</div>
                          <div>
                            <h4 className="text-2xl font-black text-ice italic tracking-tighter leading-none">{reg.club.name}</h4>
                            <p className="text-[10px] text-ice/40 uppercase font-bold tracking-widest mt-2 italic">Aguardando aprovação do organizador</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/10">
                          ⏳ Pendente
                        </span>
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
                currentUserId={userId}
              />
            </div>
          )}

          {tab === 'matches' && (
            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.4em] px-2 italic">Cronograma de Partidas</h3>
              
              <div className="space-y-10">
                {Array.from(new Set(comp.matches.map(m => m.round))).sort((a, b) => (Number(a) - Number(b))).map(round => (
                  <div key={Number(round)} className="space-y-4">
                    <h4 className="text-xs font-black text-ice/40 uppercase tracking-[0.2em] px-2 italic border-l-2 border-azure/40">Rodada {Number(round)}</h4>
                    <div className="grid gap-4">
                      {comp.matches.filter(m => m.round === round).map(match => {
                        const canManage = isOrganizer || 
                                          match.homeRegistration?.club.presidentId === userId || 
                                          match.awayRegistration?.club.presidentId === userId;
                        const isOrgPresident = comp.organization?.presidentId === userId;
                        const needsValidation = comp.requiresValidation && match.status === 'finished' && !match.isValidated;
                        
                        return (
                          <div key={match.id} className={`relative group bg-slate border ${needsValidation ? 'border-amber-500/50 grayscale-[0.5]' : match.isValidated && comp.requiresValidation ? 'border-emerald-500/30' : 'border-azure/5'} rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-azure/20 transition-all shadow-xl overflow-hidden`}>
                            {needsValidation && (
                              <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
                            )}
                            {(canManage || (isOrgPresident && needsValidation)) && (
                              <div className="absolute top-3 right-5 flex gap-2">
                                {needsValidation && (isOrgPresident || isAdmin) && (
                                  <form action={validateMatchAction as any}>
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <button className="bg-amber-500 hover:bg-emerald-500 text-slate px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all group/val">
                                      <CheckCheck size={12} className="group-hover/val:scale-110 transition-transform" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">Validar Resultado</span>
                                    </button>
                                  </form>
                                )}
                                <Link 
                                  href={`/dashboard/competitions/${compId}/matches/${match.id}`} 
                                  className="bg-slate-dark/50 border border-azure/20 text-[8px] font-black text-azure hover:text-ice px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0"
                                >
                                  Súmula <ChevronRight className="w-2 h-2" />
                                </Link>
                              </div>
                            )}

                            {/* Home Team */}
                            <div className="flex items-center gap-4 flex-1 justify-end min-w-0">
                              <span className="text-sm font-black text-ice truncate italic tracking-tighter">{match.homeRegistration?.club.name || 'TBD'}</span>
                              <div className="h-10 w-10 bg-slate-dark rounded-xl flex items-center justify-center font-black text-ice/30 text-[10px] border border-ice/5 uppercase">{match.homeRegistration?.club.tag || '?'}</div>
                            </div>

                            {/* Score / VS */}
                            <div className="flex flex-col items-center px-8 border-x border-azure/10">
                              <div className="flex items-center gap-3 font-black text-2xl italic tracking-tighter">
                                <span className={match.status === 'finished' || match.status === 'live' ? 'text-ice' : 'text-ice/20'}>{match.homeScore ?? 0}</span>
                                <span className="text-[10px] text-azure tracking-[0.3em] uppercase not-italic">VS</span>
                                <span className={match.status === 'finished' || match.status === 'live' ? 'text-ice' : 'text-ice/20'}>{match.awayScore ?? 0}</span>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${
                                match.status === 'live' ? 'text-red-500 animate-pulse' : 'text-ice/20'
                              }`}>
                                {match.status === 'scheduled' ? 'Agendado' : match.status === 'live' ? '• Ao Vivo' : needsValidation ? 'Aguardando Validação' : 'Finalizado'}
                              </span>
                              {match.isValidated && comp.requiresValidation && (
                                <span className="flex items-center gap-1 text-[7px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">
                                  <CheckCheck size={8} /> Validado
                                </span>
                              )}
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center gap-4 flex-1 justify-start min-w-0">
                              <div className="h-10 w-10 bg-slate-dark rounded-xl flex items-center justify-center font-black text-ice/30 text-[10px] border border-ice/5 uppercase">{match.awayRegistration?.club.tag || '?'}</div>
                              <span className="text-sm font-black text-ice truncate italic tracking-tighter">{match.awayRegistration?.club.name || 'TBD'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {comp.matches.length === 0 && (
                  <div className="text-center py-20 opacity-20 italic text-sm">Nenhuma partida gerada ainda.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'bracket' && !!comp.knockoutConfig && (
            <div className="space-y-8">
              <div className="mb-4">
                <h3 className="text-2xl font-black text-ice italic tracking-tight">Chaveamento</h3>
                <p className="text-[10px] text-azure font-black uppercase tracking-widest mt-1">Mata-Mata Oficial</p>
              </div>
              <div className="w-full min-h-[600px] h-auto bg-slate/30 border-2 border-azure/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-azure/5 via-transparent to-transparent pointer-events-none z-10" />
                  <div className="p-4 md:p-10 h-full">
                    <KnockoutBracket matches={comp.matches as any} config={comp.knockoutConfig as any} />
                  </div>
              </div>
            </div>
          )}

          {tab === 'classification' && comp.format !== 'knockout' && (
            <div className="space-y-12">
              <div>
                <h3 className="text-2xl font-black text-ice italic tracking-tight">Tabela de Classificação</h3>
                <p className="text-[10px] text-azure font-black uppercase tracking-widest mt-1">Pontos corridos e estatísticas em tempo real</p>
              </div>
              
              {groups.map((gId, i) => {
                const groupStandings = allStandings.filter(s => s.groupId === gId);
                return (
                  <div key={gId} className="space-y-4">
                    {comp.format === 'groups_knockout' && (
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-6 w-1 bg-azure rounded-full shadow-[0_0_10px_rgba(0,163,255,0.5)]" />
                        <h4 className="text-sm font-black text-ice italic uppercase tracking-[0.2em]">Grupo {gId}</h4>
                      </div>
                    )}
                    <StandingsTable standings={groupStandings} />
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-azure uppercase tracking-[0.4em] px-2 italic text-center">Líderes da Competição</h3>
              <CompetitionStatistics 
                topScorers={topScorers}
                topAssisters={topAssisters}
                topMVPs={topMVPs}
                topGoalkeepers={topGoalkeepers}
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
                      <EditCompetitionDialog competition={comp} role={role} />
                      <StartTournamentButton 
                        competitionId={compId}
                        disabled={comp.status !== 'registration' || allRegistrations.filter(r => r.status === 'approved').length < 2}
                      />
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

