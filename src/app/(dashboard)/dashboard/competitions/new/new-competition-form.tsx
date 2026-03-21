'use client';

import { useState } from 'react';
import { createCompetitionAction } from '@/app/actions/competitions';
import { Settings, Info } from 'lucide-react';
import { TieBreakerSorter } from '@/components/tie-breaker-sorter';

export function NewCompetitionForm({
  allModalities,
  myOrganizations,
  organizationId,
}: {
  allModalities: any[];
  myOrganizations: any[];
  organizationId?: string;
}) {
  const [format, setFormat] = useState('round_robin');
  const [tieBreakerOrder, setTieBreakerOrder] = useState<string[]>(['pts', 'wins', 'goalDiff', 'goalsFor']);

  return (
    <form action={createCompetitionAction} className="space-y-8">
      {/* Step 1: Identity */}
      <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">1</span>
          <h3 className="text-lg font-bold text-ice">Identidade & Local</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Nome da Competição</label>
            <input 
              name="name"
              type="text"
              required
              placeholder="Ex: Copa Master de Inverno"
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Modalidade</label>
            <select 
              name="modalityId"
              required
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none"
            >
              <option value="">Selecione...</option>
              {allModalities.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Organização Responsável</label>
            <select 
              name="organizationId"
              required
              defaultValue={organizationId || ""}
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
            >
              <option value="" disabled>Selecione a Organização...</option>
              {myOrganizations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Formato</label>
            <select 
              name="format"
              required
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
            >
              <option value="round_robin">Pontos Corridos (Round Robin)</option>
              <option value="knockout">Mata-mata (Eliminatória)</option>
              <option value="groups_knockout">Grupos + Mata-mata</option>
            </select>
          </div>
        </div>
      </section>

      {/* Conditional Step: Knockout Settings */}
      {(format === 'knockout' || format === 'groups_knockout') && (
        <section className="bg-slate border border-azure/30 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-azure/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-8 w-8 bg-azure text-slate rounded-lg flex items-center justify-center font-black text-sm">
                <Settings size={16} />
              </span>
              <h3 className="text-lg font-bold text-azure italic">Configurações de Mata-mata</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Formato do Confronto</label>
                <select 
                  name="matchupFormat"
                  className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
                >
                  <option value="single">Jogo Único</option>
                  <option value="two_legs">Ida e Volta</option>
                  <option value="best_of_3">Série Melhor de 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Desempate (Tie-breaker)</label>
                <select 
                  name="tieBreaker"
                  className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
                >
                  <option value="extra_time_then_penalties">Prorrogação + Pênaltis</option>
                  <option value="penalties_only">Pênaltis Direto</option>
                  <option value="golden_goal">Gol de Ouro (Morte Súbita)</option>
                  <option value="none">Nenhum (Permite Empate)</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Conditional Step: Group/League Settings */}
      {(format === 'groups_knockout' || format === 'round_robin') && (
        <section className="bg-slate border border-azure/30 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-azure/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-8 w-8 bg-azure text-slate rounded-lg flex items-center justify-center font-black text-sm">
                <Settings size={16} />
              </span>
              <h3 className="text-lg font-bold text-azure italic">Sistema de Pontos {format === 'groups_knockout' && '& Grupos'}</h3>
            </div>
            
            <div className="space-y-6 mt-6">
              {format === 'groups_knockout' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Quantidade de Grupos</label>
                    <input 
                      name="groupsCount"
                      type="number"
                      placeholder="Ex: 2"
                      defaultValue={2}
                      className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Classificados por Grupo</label>
                    <input 
                      name="advancingPerGroup"
                      type="number"
                      placeholder="Ex: 2"
                      defaultValue={2}
                      className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Vitória (pts)</label>
                  <input 
                    name="pointsPerWin"
                    type="number"
                    defaultValue={3}
                    className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Empate (pts)</label>
                  <input 
                    name="pointsPerDraw"
                    type="number"
                    defaultValue={1}
                    className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black px-1">Derrota (pts)</label>
                  <input 
                    name="pointsPerLoss"
                    type="number"
                    defaultValue={0}
                    className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="hidden"
                  name="tieBreakerOrder"
                  value={tieBreakerOrder.join(',')}
                />
                <TieBreakerSorter 
                  initialOrder={tieBreakerOrder}
                  onChange={(newOrder) => setTieBreakerOrder(newOrder)}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Settings & Financials */}
      <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">2</span>
          <h3 className="text-lg font-bold text-ice">Configurações & Premiação</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Máx. de Equipes</label>
            <input 
              name="maxTeams"
              type="number"
              placeholder="Ex: 16"
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Taxa de Inscrição ($)</label>
            <input 
              name="entryFee"
              type="number"
              defaultValue={0}
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Premiação Total ($)</label>
            <input 
              name="prizePool"
              type="number"
              defaultValue={0}
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Step 3: Roster Rules */}
      <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">3</span>
          <h3 className="text-lg font-bold text-ice">Regras de Elenco</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Mín. Jogadores por Time</label>
            <input 
              name="minPlayersPerTeam"
              type="number"
              defaultValue={1}
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Máx. Jogadores por Time</label>
            <input 
              name="maxPlayersPerTeam"
              type="number"
              placeholder="Ex: 22"
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Step 4: Registration Schedule */}
      <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">4</span>
          <h3 className="text-lg font-bold text-ice">Cronograma de Inscrições</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Início das Inscrições</label>
            <input 
              name="registrationStartDate"
              type="date"
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Fim das Inscrições</label>
            <input 
              name="registrationEndDate"
              type="date"
              className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-azure/5">
          <h4 className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black mb-4 px-1">Janelas de Inscrição Recorrentes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ice/40 px-1">Recorrência</label>
              <select 
                name="windowType"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
              >
                <option value="none">Nenhuma</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ice/40 px-1">Dia (Semana 0-6 / Mês 1-31)</label>
              <input 
                name="windowDay"
                type="number"
                placeholder="Ex: 1"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-ice/40 px-1">Duração (dias)</label>
              <input 
                name="windowDuration"
                type="number"
                placeholder="Ex: 2"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      <button 
        type="submit"
        className="w-full bg-gradient-to-r from-azure to-blue-600 text-slate font-black py-5 rounded-2xl shadow-xl shadow-azure/20 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-[0.2em]"
      >
        Finalizar e Publicar Torneio
      </button>
    </form>
  );
}
