'use client';

import React, { useState } from 'react';
import { generateMatchesAction } from '@/app/actions/competitions';
import { Play } from 'lucide-react';

interface StartTournamentButtonProps {
  competitionId: number;
  disabled?: boolean;
}

export function StartTournamentButton({ competitionId, disabled }: StartTournamentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('competitionId', String(competitionId));
    
    const res = await generateMatchesAction(formData);
    if (res.success) {
      // Logic for success if needed
      window.location.reload(); // Simple refresh for now
    } else {
      alert(res.error || 'Erro ao gerar partidas');
    }
    setLoading(false);
    setShowConfirm(false);
  };

  return (
    <>
      <button 
        type="button"
        disabled={disabled || loading}
        onClick={() => setShowConfirm(true)}
        className="bg-azure hover:bg-azure-dark text-slate px-6 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-azure/10 disabled:opacity-20 italic flex items-center gap-2"
      >
        {loading ? 'Gerando...' : 'Gerar Tabela & Iniciar Torneio'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-dark/80 backdrop-blur-md animate-in fade-in transition-all">
          <div className="bg-slate border border-azure/20 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in slide-in-from-bottom-5">
            <div>
               <h3 className="text-xl font-black text-ice italic">Iniciar Competição?</h3>
               <p className="text-xs text-ice/40 uppercase tracking-widest mt-2 leading-relaxed">
                 Esta ação irá gerar o cronograma de partidas e mudar o status para <span className="text-azure">ATIVO</span>. Novos clubes não poderão se inscrever.
               </p>
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={() => setShowConfirm(false)}
                 className="flex-1 px-6 py-3 rounded-xl border border-azure/10 text-[10px] font-black text-ice/40 uppercase hover:text-ice transition-all"
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleStart}
                 disabled={loading}
                 className="flex-1 bg-azure hover:bg-azure-dark px-6 py-3 rounded-xl text-[10px] font-black text-slate uppercase transition-all shadow-lg shadow-azure/20"
               >
                 {loading ? 'Processando...' : 'Confirmar & Iniciar'}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
