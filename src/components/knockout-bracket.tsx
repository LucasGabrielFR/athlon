'use client';

import React, { useMemo } from 'react';
import { ShieldAlert, Trophy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Club {
  id: number;
  name: string;
  tag: string;
  logoUrl?: string | null;
}

interface Registration {
  id: number;
  club: Club;
}

interface Match {
  id: number;
  competitionId: number;
  status: string;
  startTime: Date | null;
  homeScore: number | null;
  awayScore: number | null;
  round: number | null;
  stage: string;
  seriesId: string | null;
  homeRegistration: Registration | null;
  awayRegistration: Registration | null;
}

interface KnockoutBracketProps {
  matches: Match[];
  config?: {
    matchupFormat?: string;
    tieBreaker?: string;
  } | null;
}

export function KnockoutBracket({ matches, config }: KnockoutBracketProps) {
  // Group matches by Series (matchup)
  const matchupsByRound = useMemo(() => {
    // Filter matches to only include knockout stage matches
    const knockoutMatches = matches.filter(m => m.stage !== 'groups');

    const seriesMap = new Map<string, Match[]>();
    knockoutMatches.forEach(m => {
      const key = m.seriesId || `m_${m.id}`;
      if (!seriesMap.has(key)) seriesMap.set(key, []);
      seriesMap.get(key)!.push(m);
    });

    // Group series by round
    const roundsMap = new Map<number, Match[][]>();
    Array.from(seriesMap.entries()).forEach(([sId, seriesMatches]) => {
      const round = seriesMatches[0].round || 1;
      if (!roundsMap.has(round)) roundsMap.set(round, []);
      roundsMap.get(round)!.push(seriesMatches);
    });

    // Sort rounds ascending (Round 1 -> Round 2 -> Final)
    const sortedRounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);
    
    return sortedRounds.map(r => ({
      round: r,
      maxRounds: sortedRounds.length,
      matchups: roundsMap.get(r)!
    }));
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate rounded-3xl border border-azure/10">
        <ShieldAlert className="w-16 h-16 text-azure/30 mb-4" />
        <h3 className="text-xl font-black text-ice uppercase tracking-widest text-center">Nenhum Confronto</h3>
        <p className="text-azure/60 mt-2 text-center text-sm">Os confrontos do mata-mata ainda não foram gerados.</p>
      </div>
    );
  }

  const getRoundName = (currentRound: number, totalRounds: number) => {
    const roundsToFinal = totalRounds - currentRound;
    
    switch (roundsToFinal) {
      case 0: return 'Final';
      case 1: return 'Semifinal';
      case 2: return 'Quartas de Final';
      case 3: return 'Oitavas de Final';
      default: return `Rodada ${currentRound}`;
    }
  };

  return (
    <div className="bg-slate/50 backdrop-blur-xl border border-azure/10 rounded-3xl p-4 lg:p-8 overflow-x-auto overflow-y-hidden custom-scrollbar min-h-full transition-all">
      <div className="flex gap-4 md:gap-12 min-w-max pb-8 relative h-full">
        {matchupsByRound.map((roundGroup, rIndex) => (
          <div 
            key={roundGroup.round} 
            className="flex flex-col w-[280px] md:w-[320px] relative z-10"
          >
            {/* Round Header */}
            <div className="mb-10 text-center bg-slate-dark/80 backdrop-blur-md py-4 rounded-2xl border border-azure/20 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-azure/5 to-transparent group-hover:from-azure/10 transition-all pointer-events-none" />
               <h4 className="text-[10px] font-black text-azure uppercase tracking-[0.3em] italic">
                  {getRoundName(roundGroup.round, roundGroup.maxRounds)}
               </h4>
            </div>
            
            <div className="flex flex-col justify-around flex-grow relative gap-6">
              {roundGroup.matchups.map((series, mIndex) => {
                const firstMatch = series[0];
                const homeClub = firstMatch.homeRegistration?.club;
                const awayClub = firstMatch.awayRegistration?.club;
                
                let homeAgg = 0;
                let awayAgg = 0;
                let isFinished = true;
                let isLive = false;
                
                series.forEach(m => {
                  homeAgg += m.homeScore || 0;
                  awayAgg += m.awayScore || 0;
                  if (m.status !== 'finished') isFinished = false;
                  if (m.status === 'live') isLive = true;
                });

                const homeWins = isFinished && homeAgg > awayAgg;
                const awayWins = isFinished && awayAgg > homeAgg;

                return (
                  <div key={firstMatch.id} className="relative py-4 group">
                    {/* Bracket Connector Path Logic would go here if complex. Using simple layout for now */}
                    
                    <Link 
                      href={`/dashboard/competitions/${firstMatch.competitionId}/matches/${firstMatch.id}`} 
                      className={`block bg-slate-dark/95 border-2 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 ${
                        isLive ? 'border-red-500/50 shadow-red-500/10' : 
                        isFinished ? 'border-azure/5 shadow-black/40' : 
                        'border-azure/20 hover:border-azure/60 shadow-black/20'
                      }`}
                    >
                      <div className="flex flex-col">
                        {/* Home Team */}
                        <div className={`flex items-center justify-between p-4 border-b border-azure/5 transition-colors ${homeWins ? 'bg-azure/10' : ''}`}>
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-slate border border-azure/20 shrink-0 flex items-center justify-center font-black text-ice/40 text-[10px] shadow-inner">
                              {homeClub?.tag || '?'}
                            </div>
                            <span className={`text-[13px] truncate font-black tracking-tight italic ${homeWins ? 'text-ice' : isFinished ? 'text-ice/30' : 'text-ice'}`}>
                              {homeClub?.name || 'A DEFINIR'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className={`text-base font-black w-8 text-center tabular-nums ${homeWins ? 'text-azure' : isFinished ? 'text-ice/30' : 'text-ice'}`}>
                               {isFinished || homeAgg > 0 || isLive ? homeAgg : '-'}
                             </span>
                             {homeWins && <Trophy className="w-3 h-3 text-azure opacity-50" />}
                          </div>
                        </div>
                        
                        {/* Away Team */}
                        <div className={`flex items-center justify-between p-4 transition-colors ${awayWins ? 'bg-azure/10' : ''}`}>
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-slate border border-azure/20 shrink-0 flex items-center justify-center font-black text-ice/40 text-[10px] shadow-inner">
                              {awayClub?.tag || '?'}
                            </div>
                            <span className={`text-[13px] truncate font-black tracking-tight italic ${awayWins ? 'text-ice' : isFinished ? 'text-ice/30' : 'text-ice'}`}>
                              {awayClub?.name || 'A DEFINIR'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className={`text-base font-black w-8 text-center tabular-nums ${awayWins ? 'text-azure' : isFinished ? 'text-ice/30' : 'text-ice'}`}>
                               {isFinished || awayAgg > 0 || isLive ? awayAgg : '-'}
                             </span>
                             {awayWins && <Trophy className="w-3 h-3 text-azure opacity-50" />}
                          </div>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className={`bg-black/20 px-4 py-2 flex items-center justify-between border-t border-azure/5`}>
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : isFinished ? 'bg-azure/20' : 'bg-azure'}`} />
                           <span className="text-[9px] text-ice/40 uppercase font-bold tracking-widest italic">
                             {isLive ? 'AO VIVO' : isFinished ? 'FINALIZADO' : 'AGENDADO'}
                           </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-ice/20 group-hover:text-azure transition-colors" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
