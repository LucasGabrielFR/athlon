'use client';

import { updateCompetitionAction } from '@/app/actions/competitions';
import { useState } from 'react';
import { Edit2, X, Settings, Info } from 'lucide-react';

export function EditCompetitionDialog({ 
  competition 
}: { 
  competition: any 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isLocked = competition.status !== 'planned';

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-slate-dark hover:bg-slate border border-azure/20 text-ice/60 hover:text-azure px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
      >
        <Edit2 size={12} />
        Editar Informações
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-dark/80 backdrop-blur-sm">
          <div className="bg-slate border border-azure/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-azure/10 flex justify-between items-center sticky top-0 bg-slate z-10">
              <div>
                <h2 className="text-2xl font-black text-ice flex items-center gap-3 italic">
                  <Settings className="text-azure" />
                  Editar Torneio
                </h2>
                <p className="text-xs text-ice/40 uppercase font-black tracking-widest mt-1 italic">Atualize as configurações da competição</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-ice/20 hover:text-ice transition-colors">
                <X size={24} />
              </button>
            </div>

            <form action={async (formData) => {
              await updateCompetitionAction(formData);
              setIsOpen(false);
            }} className="p-8 space-y-8">
              <input type="hidden" name="competitionId" value={competition.id} />

              <div className="space-y-4">
                <h3 className="text-[10px] text-azure font-black uppercase tracking-[0.2em] px-1 italic">Informações Básicas</h3>
                <div>
                  <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1">Nome Completo</label>
                  <input 
                    name="name"
                    defaultValue={competition.name}
                    className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1">Descrição</label>
                  <textarea 
                    name="description"
                    defaultValue={competition.description}
                    className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold min-h-[100px]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] text-azure font-black uppercase tracking-[0.2em] italic">Configurações de Jogo</h3>
                  {isLocked && (
                    <div className="flex items-center gap-1.5 text-[8px] text-amber-500 font-black uppercase tracking-widest italic animate-pulse">
                      <Info size={10} />
                      Bloqueado após o início
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Máximo de Equipes</label>
                    <input 
                      name="maxTeams"
                      type="number"
                      disabled={isLocked}
                      defaultValue={competition.maxTeams}
                      className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Mín. Jogadores / Time</label>
                    <input 
                      name="minPlayersPerTeam"
                      type="number"
                      disabled={isLocked}
                      defaultValue={competition.minPlayersPerTeam}
                      className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Inscrição ($)</label>
                    <input 
                      name="entryFee"
                      type="number"
                      disabled={isLocked}
                      defaultValue={competition.entryFee}
                      className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Premiação ($)</label>
                    <input 
                      name="prizePool"
                      type="number"
                      disabled={isLocked}
                      defaultValue={competition.prizePool}
                      className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-azure/10 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-dark hover:bg-slate border border-azure/20 text-ice/60 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest italic"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-azure hover:bg-azure-dark text-slate py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-azure/20 italic"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
