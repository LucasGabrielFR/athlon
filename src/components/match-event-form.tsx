'use client';

import { useState } from 'react';
import { recordMatchEventAction } from '@/app/actions/competitions';
import { Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Player {
  userId: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  roster: Player[];
}

interface MatchEventFormProps {
  matchId: number;
  homeTeam: Team;
  awayTeam: Team;
  statTypes: { id: number; name: string }[];
  compId: number;
  manageableRegistrationIds: number[];
  status: string;
}

export function MatchEventForm({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  statTypes, 
  compId,
  manageableRegistrationIds,
  status
}: MatchEventFormProps) {
  const [selectedRegId, setSelectedRegId] = useState(homeTeam.id);
  
  const currentTeam = selectedRegId === homeTeam.id ? homeTeam : awayTeam;
  const hasPlayers = currentTeam.roster.length > 0;

  return (
    <div className="bg-slate border border-azure/10 rounded-[2.5rem] p-8 space-y-8 sticky top-8">
      <div>
        <h3 className="text-lg font-black text-ice italic flex items-center gap-2">
          <Plus className="w-5 h-5 text-azure" /> Registrar Evento
        </h3>
        <p className="text-[9px] text-ice/40 uppercase font-black tracking-widest mt-1">
          Adicione gols, scouts e punições
        </p>
      </div>

      <form action={recordMatchEventAction} className="space-y-6">
        <input type="hidden" name="matchId" value={matchId} />
        
        <div className="space-y-2">
          <label className="text-[9px] font-black text-azure uppercase tracking-widest">Equipe</label>
          <select 
            name="registrationId" 
            required 
            value={selectedRegId}
            onChange={(e) => setSelectedRegId(Number(e.target.value))}
            className="w-full bg-slate-dark border border-azure/10 rounded-xl px-4 py-3 text-[11px] text-ice font-bold focus:border-azure outline-none transition-all cursor-pointer"
          >
            <option value={homeTeam.id}>{homeTeam.name}</option>
            <option value={awayTeam.id}>{awayTeam.name}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-azure uppercase tracking-widest">Tipo de Evento</label>
          <select name="type" required className="w-full bg-slate-dark border border-azure/10 rounded-xl px-4 py-3 text-[11px] text-ice font-bold focus:border-azure outline-none transition-all cursor-pointer">
            {statTypes.length > 0 ? (
              statTypes.map(stat => (
                <option key={stat.id} value={stat.name}>{stat.name}</option>
              ))
            ) : (
              <>
                <option value="Gols">Gols</option>
                <option value="Cartão Amarelo">Cartão Amarelo</option>
                <option value="Cartão Vermelho">Cartão Vermelho</option>
              </>
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-azure uppercase tracking-widest">Jogador</label>
          {hasPlayers ? (
            <select name="playerId" required className="w-full bg-slate-dark border border-azure/10 rounded-xl px-4 py-3 text-[11px] text-ice font-bold focus:border-azure outline-none transition-all cursor-pointer">
              {currentTeam.roster.map(p => (
                <option key={p.userId} value={p.userId}>{p.name}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-3">
              <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-[10px] text-red-400 font-bold italic">
                Nenhum jogador escalado nesta equipe!
              </div>
              {manageableRegistrationIds.includes(selectedRegId) && (
                <Link 
                  href={`/dashboard/competitions/${compId}/roster?registrationId=${selectedRegId}`}
                  className="w-full bg-azure/10 hover:bg-azure/20 text-azure border border-azure/20 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <UserPlus size={14} /> Escalar Jogadores agora
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-azure uppercase tracking-widest">Minuto</label>
          <input type="number" name="minute" defaultValue={0} required className="w-full bg-slate-dark border border-azure/10 rounded-xl px-4 py-3 text-[11px] text-ice font-bold focus:border-azure outline-none" />
        </div>

        <button 
          disabled={status === 'finished' || !hasPlayers}
          className="w-full bg-azure hover:bg-azure-dark text-slate py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-azure/10 disabled:opacity-20 flex items-center justify-center gap-2"
        >
          Registrar Evento
        </button>
      </form>
    </div>
  );
}
