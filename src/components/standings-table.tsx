'use client';

import React from 'react';
import { Trophy, ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

export interface TeamStanding {
  clubId: number;
  name: string;
  tag: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface StandingsTableProps {
  standings: TeamStanding[];
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <div className="bg-slate border border-azure/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-dark/50 border-b border-azure/10">
              <th className="px-6 py-5 text-left text-[10px] font-black text-azure uppercase tracking-widest italic">#</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-azure uppercase tracking-widest italic">Equipe</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">P</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">J</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">V</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">E</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">D</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">GP</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">GC</th>
              <th className="px-4 py-5 text-center text-[10px] font-black text-azure uppercase tracking-widest italic">SG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-azure/5">
            {standings.map((team, index) => (
              <tr key={team.clubId} className="group hover:bg-azure/5 transition-colors">
                <td className="px-6 py-6 whitespace-nowrap">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black italic shadow-inner ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                    index === 2 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/30' :
                    'bg-slate-dark text-ice/40 border border-azure/10'
                  }`}>
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-dark border border-azure/10 rounded-xl flex items-center justify-center font-black text-[10px] text-ice/40 uppercase group-hover:border-azure/30 transition-all">
                      {team.tag}
                    </div>
                    <div>
                      <div className="text-sm font-black text-ice italic">{team.name}</div>
                      <div className="text-[10px] text-ice/20 font-black uppercase tracking-widest leading-none">Athlon Club</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-sm font-black text-ice italic">{team.points}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-[11px] font-black text-ice/40">{team.played}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-[11px] font-black text-green-500/60 ">{team.wins}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-[11px] font-black text-ice/30">{team.draws}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-[11px] font-black text-red-500/60">{team.losses}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-[11px] font-black text-ice/20">{team.goalsFor}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center text-[11px] font-black text-ice/20">{team.goalsAgainst}</td>
                <td className="px-4 py-6 whitespace-nowrap text-center">
                  <span className={`text-[11px] font-black italic px-2 py-1 rounded-md ${
                    team.goalDifference > 0 ? 'bg-green-500/10 text-green-500' :
                    team.goalDifference < 0 ? 'bg-red-500/10 text-red-500' :
                    'bg-ice/10 text-ice/40'
                  }`}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {standings.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <Trophy className="w-12 h-12 text-azure/10 mx-auto" />
          <p className="text-[10px] font-black text-ice/20 uppercase tracking-[0.3em] italic">Aguardando início das partidas...</p>
        </div>
      )}
    </div>
  );
}
