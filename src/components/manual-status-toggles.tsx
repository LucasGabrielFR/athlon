'use client';

import { toggleManualStatusAction } from '@/app/actions/competitions';
import { Power, Radio, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { useState, useTransition } from 'react';

export function ManualStatusToggles({ 
  competition 
}: { 
  competition: any 
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmData, setConfirmData] = useState<{
    field: 'isRegistrationManualOpen' | 'isWindowManualOpen';
    label: string;
    nextState: boolean;
  } | null>(null);

  const handleToggleRequest = (field: 'isRegistrationManualOpen' | 'isWindowManualOpen', label: string, currentState: boolean) => {
    setConfirmData({ field, label, nextState: !currentState });
  };

  const confirmAction = () => {
    if (!confirmData) return;
    
    const formData = new FormData();
    formData.append('competitionId', competition.id);
    formData.append('field', confirmData.field);
    
    startTransition(async () => {
      await toggleManualStatusAction(formData);
      setConfirmData(null);
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Registration Toggle */}
      <button 
        disabled={isPending}
        onClick={() => handleToggleRequest('isRegistrationManualOpen', 'Inscrições', competition.isRegistrationManualOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group disabled:opacity-50 ${
          competition.isRegistrationManualOpen 
            ? 'bg-azure/10 border-azure/40 text-azure' 
            : 'bg-slate border-azure/5 text-ice/40 hover:border-azure/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <Radio 
            size={18} 
            className={competition.isRegistrationManualOpen ? 'animate-pulse' : 'opacity-40'} 
          />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest italic">Inscrições</p>
            <p className="text-[8px] font-bold uppercase opacity-60 tracking-tighter">Override Manual</p>
          </div>
        </div>
        <div className={`h-8 w-12 rounded-full relative transition-all ${
          competition.isRegistrationManualOpen ? 'bg-azure' : 'bg-slate-dark border border-ice/5'
        }`}>
          <div className={`absolute top-1 w-6 h-6 rounded-full bg-ice transition-all ${
            competition.isRegistrationManualOpen ? 'left-5' : 'left-1'
          }`} />
        </div>
      </button>

      {/* Transfers Toggle */}
      <button 
        disabled={isPending}
        onClick={() => handleToggleRequest('isWindowManualOpen', 'Janela de Transferências', competition.isWindowManualOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group disabled:opacity-50 ${
          competition.isWindowManualOpen 
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
            : 'bg-slate border-ice/5 text-ice/40 hover:border-ice/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <RefreshCw 
            size={18} 
            className={competition.isWindowManualOpen ? 'animate-spin-slow' : 'opacity-40'} 
          />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest italic">Transferências</p>
            <p className="text-[8px] font-bold uppercase opacity-60 tracking-tighter">Janela Manual</p>
          </div>
        </div>
        <div className={`h-8 w-12 rounded-full relative transition-all ${
          competition.isWindowManualOpen ? 'bg-emerald-500' : 'bg-slate-dark border border-ice/5'
        }`}>
          <div className={`absolute top-1 w-6 h-6 rounded-full bg-ice transition-all ${
            competition.isWindowManualOpen ? 'left-5' : 'left-1'
          }`} />
        </div>
      </button>

      {/* Confirmation Modal */}
      {confirmData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-dark/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate border border-azure/20 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <AlertTriangle className="text-amber-500" size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-ice uppercase italic">Confirmar Ação</h3>
                <p className="text-sm text-ice/60">
                  Você tem certeza que deseja {confirmData.nextState ? 'ABRIR' : 'FECHAR'} manualmente as <strong>{confirmData.label}</strong>?
                </p>
                <div className="p-3 bg-slate-dark/50 rounded-xl border border-ice/5 mt-4">
                  <p className="text-[10px] text-ice/40 font-bold uppercase leading-relaxed tracking-wider">
                    Esta ação será registrada no feed da competição e notificará os participantes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setConfirmData(null)}
                  className="flex-1 bg-slate-dark hover:bg-slate border border-white/5 text-ice/40 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest italic"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAction}
                  disabled={isPending}
                  className={`flex-1 ${
                    confirmData.nextState ? 'bg-azure hover:bg-azure-dark' : 'bg-rose-500 hover:bg-rose-600'
                  } text-slate py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest italic shadow-xl disabled:opacity-50`}
                >
                  {isPending ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
