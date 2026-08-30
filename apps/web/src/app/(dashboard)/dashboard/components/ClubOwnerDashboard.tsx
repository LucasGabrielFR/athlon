"use client";

import { useState } from 'react';
import Link from 'next/link';
import { PlayerDashboard } from './PlayerDashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export function ClubOwnerDashboard({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState<'club' | 'player'>('club');

  const clubStats = data.clubStats || [];
  const presidedClubs = data.presidedClubs || [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ice/10 pb-4">
        <button
          onClick={() => setActiveTab('club')}
          className={`px-6 py-2.5 rounded-t-lg font-bold transition-colors text-sm ${
            activeTab === 'club'
              ? 'bg-azure/10 text-azure border-b-2 border-azure'
              : 'text-ice/60 hover:text-ice hover:bg-slate-dark border-b-2 border-transparent'
          }`}
        >
          Visão Geral do Clube
        </button>
        <button
          onClick={() => setActiveTab('player')}
          className={`px-6 py-2.5 rounded-t-lg font-bold transition-colors text-sm ${
            activeTab === 'player'
              ? 'bg-azure/10 text-azure border-b-2 border-azure'
              : 'text-ice/60 hover:text-ice hover:bg-slate-dark border-b-2 border-transparent'
          }`}
        >
          Minha Carreira (Jogador)
        </button>
      </div>

      {activeTab === 'club' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 gap-6">
            {presidedClubs.map((club: any) => {
              const stats = clubStats.find((s: any) => s.clubId === club.id) || { 
                matchesPlayed: 0, wins: 0, draws: 0, losses: 0, form: [], topScorers: [] 
              };

              const chartData = [
                { name: 'Vitórias', value: stats.wins, color: '#10b981' }, // emerald-500
                { name: 'Empates', value: stats.draws, color: '#f59e0b' }, // amber-500
                { name: 'Derrotas', value: stats.losses, color: '#ef4444' }, // red-500
              ];

              return (
                <div key={club.id} className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm shadow-azure/5">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-ice/10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-dark border border-azure/30 flex items-center justify-center overflow-hidden">
                        {club.logoUrl ? (
                          <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-ice/50 font-bold text-xl">{club.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-ice">{club.name}</h4>
                        <p className="text-sm text-azure font-medium">{club.tag}</p>
                      </div>
                    </div>
                    <Link href={`/dashboard/clubs/${club.id}/manage`} className="px-4 py-2 bg-azure/10 text-azure text-xs font-bold rounded-lg hover:bg-azure/20 transition-colors">
                      Gerenciar Clube
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Rendimento Gráfico */}
                    <div className="bg-slate-dark rounded-xl border border-ice/5 p-6 flex flex-col items-center">
                      <h5 className="text-ice font-bold mb-2">Desempenho Geral</h5>
                      <p className="text-xs text-ice/60 mb-6">{stats.matchesPlayed} Partidas Totais</p>
                      
                      {stats.matchesPlayed > 0 ? (
                        <div className="h-48 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(248, 250, 252, 0.1)' }}
                                itemStyle={{ color: '#f8fafc' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-ice">
                              {Math.round((stats.wins / stats.matchesPlayed) * 100)}%
                            </span>
                            <span className="text-[10px] text-ice/60 uppercase font-bold">Vitórias</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-ice/50 text-sm">
                          Nenhuma partida jogada
                        </div>
                      )}
                      
                      {/* Forma Recente */}
                      <div className="mt-6 w-full">
                        <h5 className="text-xs text-ice/60 uppercase font-bold mb-2 text-center">Forma Recente (Últimos 5 jogos)</h5>
                        <div className="flex gap-2 justify-center">
                          {stats.form.length > 0 ? stats.form.map((result: string, idx: number) => (
                            <span key={idx} className={`w-8 h-8 flex items-center justify-center rounded text-xs font-black ${
                              result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 
                              result === 'D' ? 'bg-amber-500/20 text-amber-500' : 
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {result}
                            </span>
                          )) : (
                            <span className="text-ice/40 text-xs">Sem dados</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Artilheiros */}
                    <div className="bg-slate-dark rounded-xl border border-ice/5 p-6">
                      <h5 className="text-ice font-bold mb-6 flex items-center gap-2">
                        <span>⚽</span> Top Artilheiros
                      </h5>
                      <div className="space-y-4">
                        {stats.topScorers?.length > 0 ? stats.topScorers.map((scorer: any, idx: number) => (
                          <div key={scorer.playerId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-ice/40 font-black w-4">{idx + 1}</span>
                              <span className="text-ice font-bold text-sm">{scorer.playerName}</span>
                            </div>
                            <span className="bg-azure/10 text-azure px-3 py-1 rounded text-xs font-black">
                              {scorer.goals} Gols
                            </span>
                          </div>
                        )) : (
                          <p className="text-ice/50 text-sm">Nenhum gol registrado.</p>
                        )}
                      </div>
                    </div>

                    {/* Prestígio / Sala de Troféus Simples */}
                    <div className="bg-slate-dark rounded-xl border border-ice/5 p-6 flex flex-col justify-between">
                      <div>
                        <h5 className="text-ice font-bold mb-2">Pontos de Prestígio</h5>
                        <p className="text-xs text-ice/60 mb-6">Ranking Global e Status do Clube</p>
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-black text-amber-400 drop-shadow-md">
                            {club.prestigePoints || 0}
                          </span>
                          <span className="text-ice/60 font-bold mb-1">Pts</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
                        <p className="text-amber-500 font-bold text-sm mb-1 flex items-center gap-2">
                          <span>🏆</span> Sala de Troféus
                        </p>
                        <p className="text-ice/60 text-xs">Em breve. As conquistas do seu clube aparecerão aqui.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {presidedClubs.length === 0 && (
            <div className="bg-slate rounded-xl border border-azure/20 p-8 text-center">
              <p className="text-ice/60 mb-4">Você ainda não preside nenhum clube.</p>
              <Link href="/clubs/create" className="px-6 py-3 bg-azure hover:bg-azure/90 text-slate-dark font-black rounded-xl transition-colors inline-block">
                Criar Novo Clube
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <PlayerDashboard data={data.playerData} />
        </div>
      )}
    </div>
  );
}
