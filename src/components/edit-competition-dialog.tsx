'use client';

import { updateCompetitionAction } from '@/app/actions/competitions';
import { useState } from 'react';
import { Edit2, X, Settings, Info } from 'lucide-react';
import { TieBreakerSorter } from './tie-breaker-sorter';

export function EditCompetitionDialog({ 
  competition, 
  role,
  planTier = 'free',
  existingScreenshotRequirements = []
}: { 
  competition: any;
  role: string | undefined;
  planTier?: string;
  existingScreenshotRequirements?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isLocked = competition.status !== 'planned' && competition.status !== 'registration';
  // Allow admins to always edit if it's the only way, but the user wants it to be editable before start.
  // We'll also pass role here if needed.
  const [tieBreakerOrder, setTieBreakerOrder] = useState<string[]>(
    (competition.groupsConfig as any)?.tieBreakerOrder || ['pts', 'wins', 'goalDiff', 'goalsFor']
  );
  const [requiresImageVerification, setRequiresImageVerification] = useState(competition.requiresImageVerification || false);
  const [resultPolicy, setResultPolicy] = useState(competition.resultSubmissionPolicy || 'manager_mutual');

  const getPolicyDescription = (policy: string) => {
    switch (policy) {
      case 'manager_mutual':
        return 'Qualquer manager envia o resultado. O adversário DEVE confirmar. Em caso de divergência, ele pode contestar para análise do Admin.';
      case 'manager_single':
        return 'Qualquer manager pode enviar o resultado e ele já é APROVADO AUTOMATICAMENTE. Ideal para torneios rápidos de alta confiança.';
      case 'admin_only':
        return 'Apenas a administração do torneio pode preencher e validar resultados. Os times não possuem acesso ao envio de súmulas.';
      default:
        return '';
    }
  };

  const isPro = planTier === 'pro' || role === 'admin';

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-fit flex items-center justify-center gap-2 px-6 py-2 rounded-xl border border-azure/20 text-[10px] font-black text-ice uppercase tracking-[0.2em] hover:bg-azure/5 hover:border-azure/50 transition-all group italic"
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
                <div className="space-y-4">
                  <div className="bg-slate-dark/50 border border-azure/10 rounded-2xl p-6 flex items-center justify-between group hover:border-azure/30 transition-all">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-ice flex items-center gap-2">
                        Exigir Validação da Organização
                        <Info size={14} className="text-azure opacity-50" />
                      </label>
                      <p className="text-[10px] text-ice/40 uppercase font-black italic">Os resultados só contam após aprovação do presidente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="hidden" name="requiresValidation_present" value="1" />
                      <input 
                        type="checkbox" 
                        name="requiresValidation" 
                        defaultChecked={competition.requiresValidation}
                        disabled={isLocked && role !== 'admin'}
                        className="sr-only peer" 
                      />
                      <div className="w-12 h-6 bg-slate-dark border border-azure/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-azure after:border-azure after:border after:rounded-full after:h-4 after:w-5 after:transition-all peer-checked:bg-azure/20 peer-checked:border-azure"></div>
                    </label>
                  </div>

                  <div className="bg-slate-dark/50 border border-azure/10 rounded-2xl p-6 space-y-6 group hover:border-azure/30 transition-all">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-azure font-black uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                        Configuração de Súmulas Inteligentes
                      </label>
                      <p className="text-[10px] text-ice/40 uppercase font-black italic">Defina como os managers reportam resultados e provas visuais</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1">Política de Envio</label>
                        <select 
                          name="resultSubmissionPolicy"
                          value={resultPolicy}
                          onChange={(e) => setResultPolicy(e.target.value)}
                          disabled={isLocked && role !== 'admin'}
                          className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold appearance-none disabled:opacity-50"
                        >
                          <option value="manager_mutual" className="bg-slate-dark text-ice font-bold py-2">Managers enviam e validam (Acordo Mútuo)</option>
                          <option value="manager_single" className="bg-slate-dark text-ice font-bold py-2">Apenas 1 Manager envia e já aprova</option>
                          <option value="admin_only" className="bg-slate-dark text-ice font-bold py-2">Somente a Administração lança resultados</option>
                        </select>
                        <div className="bg-azure/5 border-l-2 border-azure p-3 rounded-r-xl mt-2 animate-in fade-in slide-in-from-top-2">
                          <p className="text-xs text-ice/80 leading-relaxed font-medium">
                            {getPolicyDescription(resultPolicy)}
                          </p>
                        </div>
                        <p className="text-[10px] text-ice/30 font-bold uppercase tracking-widest pl-1 mt-2">O administrador sempre poderá sobrepor os resultados independentemente da regra.</p>
                      </div>

                      <div className={`flex items-center justify-between border-t border-azure/10 pt-4 ${!isPro ? 'opacity-60' : ''}`}>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-ice flex items-center gap-2">
                            Estatísticas Avançadas (PRO)
                            <Info size={14} className={isPro ? "text-amber-400" : "text-azure opacity-50"} />
                          </label>
                          <p className="text-[10px] text-ice/40 uppercase font-black italic">Coletar rating, assistências e defesas individuais</p>
                          {!isPro && <p className="text-[9px] text-amber-500 uppercase tracking-widest italic font-bold">Requer assinatura PRO</p>}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="hidden" name="isProStatsEnabled_present" value="1" />
                          <input 
                            type="checkbox" 
                            name="isProStatsEnabled" 
                            defaultChecked={isPro && competition.isProStatsEnabled}
                            disabled={!isPro || (isLocked && role !== 'admin')}
                            className="sr-only peer" 
                          />
                          <div className={`w-12 h-6 bg-slate-dark border border-azure/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-azure after:border-azure after:border after:rounded-full after:h-4 after:w-5 after:transition-all ${isPro ? 'peer-checked:bg-azure/20 peer-checked:border-azure' : ''}`}></div>
                        </label>
                      </div>

                      <div className={`flex items-center justify-between border-t border-azure/10 pt-4 ${!isPro ? 'opacity-60' : ''}`}>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-ice flex items-center gap-2">
                            Exigir Provas Visuais (Integridade PRO)
                            <Info size={14} className="text-azure opacity-50" />
                          </label>
                          <p className="text-[10px] text-ice/40 uppercase font-black italic">Obriga envio de prints/fotos para validar as súmulas.</p>
                          {!isPro && <p className="text-[9px] text-amber-500 uppercase tracking-widest italic font-bold">Requer assinatura PRO</p>}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="hidden" name="requiresImageVerification_present" value="1" />
                          <input 
                            type="checkbox" 
                            name="requiresImageVerification" 
                            disabled={!isPro || (isLocked && role !== 'admin')}
                            checked={isPro && requiresImageVerification}
                            onChange={(e) => setRequiresImageVerification(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className={`w-12 h-6 bg-slate-dark border border-azure/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-azure after:border-azure after:border after:rounded-full after:h-4 after:w-5 after:transition-all ${isPro ? 'peer-checked:bg-azure/20 peer-checked:border-azure' : ''}`}></div>
                        </label>
                      </div>

                      {requiresImageVerification && isPro && (
                        <div className="pt-4 border-t border-azure/10 animate-in fade-in slide-in-from-top-4 duration-300">
                          <h4 className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black mb-4 px-1">Selecione as provas exigidas</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              "Placar Final (Resultado)", 
                              "Notas (Rating) do Time Casa", 
                              "Notas (Rating) do Time Fora", 
                              "Estatísticas de Gols/Assistências", 
                              "Print do Lobby/Saguão"
                            ].map(req => (
                              <label key={req} className="flex items-center gap-3 bg-slate-dark p-3 rounded-xl border border-azure/10 cursor-pointer hover:border-azure/30 transition-colors">
                                <input 
                                  type="checkbox" 
                                  name="screenshotRequirements" 
                                  value={req} 
                                  defaultChecked={existingScreenshotRequirements.includes(req)}
                                  disabled={isLocked && role !== 'admin'}
                                  className="w-4 h-4 rounded border-slate-600 text-azure focus:ring-azure focus:ring-offset-slate-dark bg-slate-800 disabled:opacity-50" 
                                />
                                <span className="text-sm font-bold text-ice">{req}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                      required
                      min={2}
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
                      required
                      min={1}
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
                      required
                      min={0}
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
                      required
                      min={0}
                      disabled={isLocked}
                      defaultValue={competition.prizePool}
                      className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional: Knockout Settings */}
              {(competition.format === 'knockout' || competition.format === 'groups_knockout') && (
                <div className="space-y-4 pt-4 border-t border-azure/10">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] text-azure font-black uppercase tracking-[0.2em] italic">Configurações de Mata-mata</h3>
                    {isLocked && (
                      <div className="flex items-center gap-1.5 text-[8px] text-amber-500 font-black uppercase tracking-widest italic animate-pulse">
                        <Info size={10} />
                        Bloqueado após o início
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Formato do Confronto</label>
                      <select 
                        name="matchupFormat"
                        disabled={isLocked}
                        defaultValue={(competition.knockoutConfig as any)?.matchupFormat || 'single'}
                        className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic appearance-none"
                      >
                        <option value="single">Jogo Único</option>
                        <option value="two_legs">Ida e Volta</option>
                        <option value="best_of_3">Série Melhor de 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Desempate</label>
                      <select 
                        name="tieBreaker"
                        disabled={isLocked}
                        defaultValue={(competition.knockoutConfig as any)?.tieBreaker || 'extra_time_then_penalties'}
                        className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic appearance-none"
                      >
                        <option value="extra_time_then_penalties">Prorrogação + Pênaltis</option>
                        <option value="penalties_only">Pênaltis Direto</option>
                        <option value="golden_goal">Gol de Ouro (Morte Súbita)</option>
                        <option value="none">Nenhum (Permite Empate)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional: Group/League Points Settings */}
              {(competition.format === 'groups_knockout' || competition.format === 'league' || competition.format === 'round_robin') && (
                <div className="space-y-4 pt-4 border-t border-azure/10">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] text-azure font-black uppercase tracking-[0.2em] italic">Sistema de Pontos e Grupos</h3>
                    {isLocked && (
                      <div className="flex items-center gap-1.5 text-[8px] text-amber-500 font-black uppercase tracking-widest italic animate-pulse">
                        <Info size={10} />
                        Bloqueado após o início
                      </div>
                    )}
                  </div>
                  
                  {competition.format === 'groups_knockout' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Qtd de Grupos</label>
                        <input 
                          name="groupsCount"
                          type="number"
                          required
                          min={1}
                          disabled={isLocked}
                          defaultValue={(competition.groupsConfig as any)?.groupsCount || 2}
                          className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Classificados / Grupo</label>
                        <input 
                          name="advancingPerGroup"
                          type="number"
                          required
                          min={1}
                          disabled={isLocked}
                          defaultValue={(competition.groupsConfig as any)?.advancingPerGroup || 2}
                          className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Vitória (pts)</label>
                      <input 
                        name="pointsPerWin"
                        type="number"
                        required
                        min={0}
                        disabled={isLocked}
                        defaultValue={(competition.groupsConfig as any)?.pointsPerWin ?? 3}
                        className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Empate (pts)</label>
                      <input 
                        name="pointsPerDraw"
                        type="number"
                        required
                        min={0}
                        disabled={isLocked}
                        defaultValue={(competition.groupsConfig as any)?.pointsPerDraw ?? 1}
                        className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-ice/30 uppercase mb-2 block px-1 italic">Derrota (pts)</label>
                      <input 
                        name="pointsPerLoss"
                        type="number"
                        required
                        min={0}
                        disabled={isLocked}
                        defaultValue={(competition.groupsConfig as any)?.pointsPerLoss ?? 0}
                        className="w-full bg-slate-dark border border-azure/20 rounded-2xl px-6 py-4 text-ice focus:outline-none focus:border-azure transition-all font-bold disabled:opacity-30 italic text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <input 
                      type="hidden"
                      name="tieBreakerOrder"
                      value={tieBreakerOrder.join(',')}
                    />
                    <TieBreakerSorter 
                      initialOrder={tieBreakerOrder}
                      onChange={(newOrder) => setTieBreakerOrder(newOrder)}
                      disabled={isLocked}
                    />
                  </div>
                </div>
              )}

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
