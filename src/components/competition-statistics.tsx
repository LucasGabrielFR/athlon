'use client';

import { Trophy, Target, Award, Shield } from 'lucide-react';

interface PlayerStat {
  id: number;
  name: string;
  tag: string;
  value: number;
  clubName: string;
}

interface CompetitionStatisticsProps {
  topScorers: PlayerStat[];
  topAssisters: PlayerStat[];
  topMVPs: PlayerStat[];
  topGoalkeepers: PlayerStat[];
}

export function CompetitionStatistics({
  topScorers,
  topAssisters,
  topMVPs,
  topGoalkeepers
}: CompetitionStatisticsProps) {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Scorers */}
        <StatCard 
          title="Artilheiros" 
          icon={<Target className="text-red-500" />} 
          stats={topScorers} 
          unit="Gols"
        />
        
        {/* Top Assisters */}
        <StatCard 
          title="Garçons" 
          icon={<Award className="text-azure" />} 
          stats={topAssisters} 
          unit="Assists"
        />

        {/* Top MVPs */}
        <StatCard 
          title="MVP (Melhor Média)" 
          icon={<Trophy className="text-amber-500" />} 
          stats={topMVPs} 
          unit="Nota"
          isDecimal
        />

        {/* Top Goalkeepers */}
        <StatCard 
          title="Paredões (Defesas)" 
          icon={<Shield className="text-emerald-500" />} 
          stats={topGoalkeepers} 
          unit="Defesas"
        />
      </div>
    </div>
  );
}

function StatCard({ title, icon, stats, unit, isDecimal }: { 
  title: string; 
  icon: React.ReactNode; 
  stats: PlayerStat[]; 
  unit: string;
  isDecimal?: boolean;
}) {
  return (
    <div className="bg-slate border border-azure/10 rounded-[2.5rem] p-8 shadow-2xl group hover:border-azure/30 transition-all">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-slate-dark rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-black text-ice italic tracking-tighter uppercase">{title}</h3>
      </div>

      <div className="space-y-4">
        {stats.length === 0 ? (
          <p className="text-ice/20 text-xs font-black uppercase italic tracking-widest text-center py-10">Dados insuficientes</p>
        ) : (
          stats.map((player, i) => (
            <div key={player.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-azure/5 transition-colors border border-transparent hover:border-azure/10">
              <div className="flex items-center gap-4">
                <span className="text-lg font-black text-azure/40 italic w-6">#{i + 1}</span>
                <div className="h-10 w-10 bg-slate-dark rounded-full flex items-center justify-center font-black text-xs text-ice border border-azure/20">
                  {player.tag}
                </div>
                <div>
                  <p className="font-black text-ice text-sm italic tracking-tight leading-none">{player.name}</p>
                  <p className="text-[10px] text-ice/40 uppercase font-black tracking-widest mt-1">{player.clubName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-azure italic">{isDecimal ? player.value.toFixed(1) : player.value}</span>
                <span className="text-[10px] text-ice/20 block uppercase font-black italic">{unit}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
