'use client';

import { useState } from 'react';
import { setActiveModalityAction, removePlayerModalityAction, updatePlayerModalityPositionsAction } from '@/app/actions/profile';

interface Position {
  id: number;
  name: string;
  abbreviation: string | null;
}

interface LinkedItem {
  id: number;
  modalityId: number;
  modality: {
    name: string;
    isTeamBased: boolean;
    positions: Position[];
  };
  primaryPositionId: number | null;
  secondaryPositionId: number | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
}

export default function LinkedModalityItem({ item, isActive }: { item: LinkedItem, isActive: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const hasPositions = item.modality.positions.length > 0;

  if (isEditing) {
    return (
      <div className={`p-4 rounded-lg border border-azure bg-azure/5 shadow-lg shadow-azure/5 animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-ice font-bold flex items-center gap-2">
              <span className="text-xl">{item.modality.isTeamBased ? '👥' : '🧍'}</span>
              Editando: {item.modality.name}
            </p>
          </div>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-ice/40 hover:text-ice text-xs transition-colors"
          >
            Cancelar
          </button>
        </div>

        <form action={async (fd) => {
          await updatePlayerModalityPositionsAction(fd);
          setIsEditing(false);
        }} className="space-y-4">
          <input type="hidden" name="modalityId" value={item.modalityId} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-ice/40 mb-1 uppercase tracking-tighter">Posição Primária</label>
              <select
                name="primaryPositionId"
                required
                defaultValue={item.primaryPositionId ?? ''}
                className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-2 text-ice focus:outline-none focus:border-azure transition-colors text-sm"
              >
                <option value="">Escolha a principal...</option>
                {item.modality.positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.abbreviation ? `(${p.abbreviation})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-ice/40 mb-1 uppercase tracking-tighter">Posição Secundária</label>
              <select
                name="secondaryPositionId"
                defaultValue={item.secondaryPositionId ?? ''}
                className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-2 text-ice focus:outline-none focus:border-azure transition-colors text-sm"
              >
                <option value="">Nenhuma / Outra...</option>
                {item.modality.positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.abbreviation ? `(${p.abbreviation})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-azure text-navy font-bold px-4 py-2 rounded-lg hover:bg-ice transition-colors text-sm"
          >
            Salvar Posições
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
      isActive
        ? 'border-azure bg-azure/10'
        : 'border-azure/10 hover:border-azure/30 bg-slate/50'
    }`}>
      <div className="flex items-center gap-4">
        <span className="text-2xl">{item.modality.isTeamBased ? '👥' : '🧍'}</span>
        <div>
          <p className="text-ice font-bold">{item.modality.name}</p>
          <div className="flex gap-2 mt-0.5">
            {item.primaryPosition && (
              <span className="text-[10px] bg-azure/20 text-azure px-2 py-0.5 rounded border border-azure/30 font-medium">
                1ª: {item.primaryPosition.name}
              </span>
            )}
            {item.secondaryPosition && (
              <span className="text-[10px] bg-ice/5 text-ice/60 px-2 py-0.5 rounded border border-ice/10 font-medium">
                2ª: {item.secondaryPosition.name}
              </span>
            )}
            {!item.primaryPosition && !item.secondaryPosition && (
              <span className="text-[10px] text-ice/20 italic">Sem posições definidas</span>
            )}
          </div>
          {isActive && (
            <p className="text-[10px] text-azure mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-azure animate-pulse" /> Modalidade ativa
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {hasPositions && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs text-ice/60 hover:text-ice transition-colors px-3 py-1.5 rounded bg-ice/5 hover:bg-ice/10 border border-transparent hover:border-ice/10"
          >
            Editar
          </button>
        )}
        {!isActive && (
          <form action={setActiveModalityAction}>
            <input type="hidden" name="modalityId" value={item.modalityId} />
            <button type="submit" className="text-xs text-azure/60 hover:text-azure transition-colors px-3 py-1.5 rounded bg-azure/5 hover:bg-azure/10 border border-transparent hover:border-azure/20">
              Ativar
            </button>
          </form>
        )}
        <form action={removePlayerModalityAction}>
          <input type="hidden" name="modalityId" value={item.modalityId} />
          <button type="submit" className="text-xs text-red-400/50 hover:text-red-400 transition-colors px-3 py-1.5 rounded bg-red-400/5 hover:bg-red-400/10 border border-transparent hover:border-red-400/20">
            Remover
          </button>
        </form>
      </div>
    </div>
  );
}
