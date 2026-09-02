"use client";

import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, Circle } from 'lucide-react';

export function PlayerDashboard({ data }: { data: any }) {
  const radarData = data.radarStats || [];
  
  // Onboarding logic
  const hasProfileData = !!(data.user?.name && data.user?.nickname && data.user?.birthDate);
  const hasModalities = data.statsPerModality?.length > 0 || data.clubs?.length > 0;
  const showOnboarding = !hasProfileData || !hasModalities;

  return (
    <div className="space-y-8">
      {/* Onboarding Section */}
      {showOnboarding && (
        <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm shadow-azure/5">
          <h3 className="text-ice font-bold text-lg mb-2 flex items-center gap-2">
            <span>🚀</span> Bem-vindo! Vamos completar seu perfil?
          </h3>
          <p className="text-ice/60 text-sm mb-6">
            Para aproveitar ao máximo a plataforma e poder entrar em clubes, você precisa completar os passos abaixo.
          </p>
          
          <div className="space-y-4 max-w-xl">
            <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-lg bg-slate-dark border border-ice/5 hover:border-azure/30 transition-colors">
              {hasProfileData ? <CheckCircle2 className="text-emerald-500 w-5 h-5" /> : <Circle className="text-ice/30 w-5 h-5" />}
              <div>
                <p className={`text-sm font-bold ${hasProfileData ? 'text-ice' : 'text-azure'}`}>Preencha seus dados pessoais</p>
                <p className="text-xs text-ice/50">Nome, Nickname e Data de Nascimento são obrigatórios.</p>
              </div>
            </Link>

            <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-lg bg-slate-dark border border-ice/5 hover:border-azure/30 transition-colors">
              {hasModalities ? <CheckCircle2 className="text-emerald-500 w-5 h-5" /> : <Circle className="text-ice/30 w-5 h-5" />}
              <div>
                <p className={`text-sm font-bold ${hasModalities ? 'text-ice' : 'text-azure'}`}>Escolha suas modalidades</p>
                <p className="text-xs text-ice/50">Adicione as modalidades que você pratica no seu perfil.</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (1/3) */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Raio-X */}
          <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm shadow-azure/5 flex flex-col items-center h-[400px]">
            <h3 className="text-ice font-bold text-lg mb-4 flex items-center gap-2 w-full">
              <span>🕸️</span> Raio-X do Atleta
            </h3>
            
            {radarData.length > 0 ? (
              <div className="w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="var(--color-azure)" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-ice)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Atleta"
                      dataKey="value"
                      stroke="var(--color-azure)"
                      fill="var(--color-azure)"
                      fillOpacity={0.4}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-navy)', border: '1px solid var(--color-ice)', opacity: 0.9 }}
                      itemStyle={{ color: 'var(--color-ice)' }}
                      formatter={(value: any) => [`${Math.round(Number(value) || 0)}%`, 'Poder']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full flex-1 flex items-center justify-center text-ice/50 text-sm">
                Sem dados suficientes
              </div>
            )}
          </div>

          {/* User Clubs */}
          <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-ice font-bold text-lg">Meus Clubes</h3>
              <Link href="/dashboard/clubs" className="text-azure text-xs font-semibold hover:underline">Gerenciar</Link>
            </div>
            
            {data.clubs?.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-ice/60 text-sm mb-4">Você ainda não participa de nenhum clube.</p>
                <Link href="/dashboard/clubs" className="inline-block bg-azure/10 text-azure hover:bg-azure/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-azure/20">
                  Procurar Clubes
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.clubs?.map((m: any) => (
                  <Link href={`/dashboard/clubs/${m.club.id}`} key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-azure/30 hover:bg-slate-dark transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-dark border border-azure/30 overflow-hidden flex items-center justify-center shrink-0">
                      {m.club.logoUrl ? (
                        <img src={m.club.logoUrl} alt={m.club.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-ice/50 font-bold text-xs">{m.club.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ice truncate">{m.club.name}</p>
                      <p className="text-xs text-azure truncate font-medium">{m.modality?.name || 'Clube'}</p>
                    </div>
                    <div className="text-xs font-bold text-ice/60 bg-slate-dark border border-ice/10 px-2 py-1 rounded">
                      {m.status === 'active' ? 'Ativo' : m.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2/3) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Overview stats per modality */}
          <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="text-ice font-bold text-lg mb-4">Desempenho por Modalidade</h3>
            {data.statsPerModality?.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <p className="text-ice/60 text-sm">Você ainda não registrou partidas oficiais.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                {data.statsPerModality?.map((stat: any) => (
                  <div key={stat.modalityId} className="bg-slate-dark rounded-xl border border-azure/20 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl drop-shadow-sm">🎮</span>
                      <h4 className="text-ice font-black uppercase tracking-wider">{stat.modalityName}</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate p-2 rounded-lg text-center border border-ice/5">
                        <p className="text-lg font-bold text-ice">{stat.matchesPlayed}</p>
                        <p className="text-[10px] text-ice/50 uppercase font-semibold">Partidas</p>
                      </div>
                      <div className="bg-slate p-2 rounded-lg text-center border border-ice/5">
                        <p className="text-lg font-bold text-ice">{stat.totalGoals}</p>
                        <p className="text-[10px] text-ice/50 uppercase font-semibold">Gols</p>
                      </div>
                      <div className="bg-slate p-2 rounded-lg text-center border border-ice/5">
                        <p className="text-lg font-bold text-ice">{stat.totalAssists}</p>
                        <p className="text-[10px] text-ice/50 uppercase font-semibold">Assists</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Matches */}
          <div className="bg-slate rounded-xl border border-azure/20 p-6 shadow-sm flex-1">
            <h3 className="text-ice font-bold text-lg mb-4 flex items-center gap-2">
              <span>⚽</span> Histórico de Partidas
            </h3>
            {data.recentMatches?.length === 0 ? (
              <p className="text-ice/60 text-sm py-4">Nenhuma partida recente.</p>
            ) : (
              <div className="space-y-3">
                {data.recentMatches?.map((match: any) => (
                  <div key={match.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-slate-dark border border-ice/10 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${match.status === 'finished' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <p className="text-xs text-ice/60 uppercase font-bold tracking-wider">{match.status === 'finished' ? 'Finalizada' : match.status}</p>
                      </div>
                      <p className="text-sm font-bold text-ice">{match.competitionName}</p>
                      <p className="text-xs text-azure font-medium">{match.modalityName}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate rounded-lg px-4 py-2 border border-ice/5">
                      <div className="text-center">
                        <p className="text-sm font-black text-ice">{match.goals || 0}</p>
                        <p className="text-[10px] text-ice/50 uppercase font-semibold">Gols</p>
                      </div>
                      <div className="w-px h-8 bg-ice/10"></div>
                      <div className="text-center">
                        <p className="text-sm font-black text-ice">{match.assists || 0}</p>
                        <p className="text-[10px] text-ice/50 uppercase font-semibold">Assists</p>
                      </div>
                      <div className="w-px h-8 bg-ice/10"></div>
                      <div className="text-center">
                        <p className="text-sm font-black text-amber-400">{match.rating ? match.rating.toFixed(1) : '-'}</p>
                        <p className="text-[10px] text-ice/50 uppercase font-semibold">Nota</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
