'use client';

import { useState } from 'react';
import { addPlayerModalityAction } from '@/app/actions/profile';

interface Position {
  id: number;
  name: string;
  abbreviation: string | null;
}

interface Modality {
  id: number;
  name: string;
  isTeamBased: boolean;
  positions: Position[];
}

export default function AddModalityForm({ modalities }: { modalities: Modality[] }) {
  const [selectedModalityId, setSelectedModalityId] = useState<string>('');
  
  const selectedModality = modalities.find(m => m.id === Number(selectedModalityId));
  const hasPositions = selectedModality && selectedModality.positions.length > 0;

  return (
    <form action={addPlayerModalityAction} className="space-y-4">
      <div className="flex gap-3">
        <select
          name="modalityId"
          value={selectedModalityId}
          onChange={(e) => setSelectedModalityId(e.target.value)}
          className="flex-1 bg-navy border border-azure/20 rounded-lg px-4 py-2.5 text-ice focus:outline-none focus:border-azure transition-colors text-sm"
          required
        >
          <option value="">Selecione uma modalidade...</option>
          {modalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.isTeamBased ? '👥' : '🧍'} {m.name}
            </option>
          ))}
        </select>
        
        {!hasPositions && (
          <button
            type="submit"
            className="bg-azure/10 text-azure border border-azure/30 font-bold px-4 py-2.5 rounded-lg hover:bg-azure hover:text-navy transition-colors text-sm whitespace-nowrap"
          >
            + Adicionar
          </button>
        )}
      </div>

      {hasPositions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-[10px] text-ice/40 mb-1 uppercase tracking-tighter">Posição Primária (Obrigatório)</label>
            <select
              name="primaryPositionId"
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-2.5 text-ice focus:outline-none focus:border-azure transition-colors text-sm"
            >
              <option value="">Escolha a principal...</option>
              {selectedModality.positions.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.abbreviation ? `(${p.abbreviation})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-ice/40 mb-1 uppercase tracking-tighter">Posição Secundária</label>
            <select
              name="secondaryPositionId"
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-2.5 text-ice focus:outline-none focus:border-azure transition-colors text-sm"
            >
              <option value="">Nenhuma / Outra...</option>
              {selectedModality.positions.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.abbreviation ? `(${p.abbreviation})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-azure text-navy font-bold px-4 py-2.5 rounded-lg hover:bg-ice transition-colors text-sm"
            >
              Vincular Modalidade e Posições
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
