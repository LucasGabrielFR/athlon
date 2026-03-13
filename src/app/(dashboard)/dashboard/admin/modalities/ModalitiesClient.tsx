'use client';

import { useState } from 'react';
import {
  createModalityAction,
  updateModalityAction,
  deactivateModalityAction,
  reactivateModalityAction,
  createPositionAction,
  deletePositionAction,
} from '@/app/actions/modalities';

type Position = {
  id: number;
  name: string;
  abbreviation: string | null;
};

type Modality = {
  id: number;
  name: string;
  description: string | null;
  isTeamBased: boolean;
  isActive: boolean;
  createdAt: Date | null;
  positions: Position[];
};

// ── Confirmation Modal ──────────────────────────────────────
function ConfirmModal({
  modality,
  onCancel,
}: {
  modality: Modality;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-4">⚠️</span>
          <h3 className="text-xl font-bold text-ice mb-2">Desativar Modalidade</h3>
          <p className="text-ice/50 text-sm">
            Você está prestes a desativar <span className="text-ice font-semibold">{modality.name}</span>.
            Ela ficará oculta dos jogadores mas pode ser reativada a qualquer momento.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-azure/20 text-ice/60 hover:text-ice hover:border-azure/40 transition-all text-sm font-medium"
          >
            Cancelar
          </button>
          <form action={deactivateModalityAction} className="flex-1">
            <input type="hidden" name="id" value={modality.id} />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm font-bold"
            >
              Desativar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ──────────────────────────────────────────────
function EditModal({
  modality,
  onCancel,
}: {
  modality: Modality;
  onCancel: () => void;
}) {
  const [isTeamBased, setIsTeamBased] = useState(modality.isTeamBased);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate border border-azure/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-azure/10 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-xl font-bold text-ice mb-6">Editar Modalidade</h3>
        <form action={async (fd) => { await updateModalityAction(fd); onCancel(); }} className="space-y-4">
          <input type="hidden" name="id" value={modality.id} />
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nome *</label>
            <input
              type="text"
              name="name"
              defaultValue={modality.name}
              required
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice focus:outline-none focus:border-azure transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Descrição</label>
            <textarea
              name="description"
              defaultValue={modality.description ?? ''}
              rows={3}
              className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ice/60 mb-2 uppercase tracking-wider font-bold">Tipo</label>
            <div className="grid grid-cols-2 gap-2 bg-navy p-1 rounded-xl border border-azure/10">
              <button
                type="button"
                onClick={() => setIsTeamBased(true)}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${isTeamBased ? 'bg-azure text-navy shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice/60'}`}
              >
                👥 Coletivo
              </button>
              <button
                type="button"
                onClick={() => setIsTeamBased(false)}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${!isTeamBased ? 'bg-azure text-navy shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice/60'}`}
              >
                🧍 Individual
              </button>
              <input type="hidden" name="isTeamBased" value={String(isTeamBased)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-azure/20 text-ice/60 hover:text-ice transition-all text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-azure text-navy font-bold hover:bg-ice transition-colors text-sm">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Form ─────────────────────────────────────────────
function CreateForm() {
  const [hasPositions, setHasPositions] = useState(false);
  const [positions, setPositions] = useState<{ name: string; abbreviation: string }[]>([]);
  const [posInput, setPosInput] = useState({ name: '', abbreviation: '' });
  const [key, setKey] = useState(0); // reset form
  const [isTeamBased, setIsTeamBased] = useState(true);

  function addPosition() {
    if (!posInput.name.trim()) return;
    setPositions((prev) => [...prev, posInput]);
    setPosInput({ name: '', abbreviation: '' });
  }

  function removePosition(i: number) {
    setPositions((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="bg-slate rounded-xl border border-azure/10 p-6">
      <h3 className="text-ice font-bold text-lg mb-5">Nova Modalidade</h3>
      <form
        key={key}
        action={async (fd) => {
          await createModalityAction(fd);
          setPositions([]);
          setHasPositions(false);
          setIsTeamBased(true);
          setKey((k) => k + 1);
        }}
        className="space-y-5"
      >
        {/* Positions encoded as JSON */}
        <input type="hidden" name="positionsJson" value={JSON.stringify(positions)} />

        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider font-bold">Nome *</label>
          <input type="text" name="name" placeholder="ex: Futebol, League of Legends" required className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider font-bold">Descrição</label>
          <textarea name="description" rows={2} placeholder="Breve descrição..." className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors resize-none" />
        </div>
        <div>
          <label className="block text-xs text-ice/60 mb-2 uppercase tracking-wider font-bold">Tipo</label>
          <div className="grid grid-cols-2 gap-2 bg-navy p-1 rounded-xl border border-azure/10">
            <button
              type="button"
              onClick={() => setIsTeamBased(true)}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${isTeamBased ? 'bg-azure text-navy shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice/60'}`}
            >
              👥 Coletivo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTeamBased(false);
                setHasPositions(false);
                setPositions([]);
              }}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${!isTeamBased ? 'bg-azure text-navy shadow-lg shadow-azure/20' : 'text-ice/40 hover:text-ice/60'}`}
            >
              🧍 Individual
            </button>
            <input type="hidden" name="isTeamBased" value={String(isTeamBased)} />
          </div>
        </div>

        {/* Positions toggle */}
        {isTeamBased && (
          <div className="border-t border-azure/10 pt-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-ice font-medium">Posições específicas</p>
                <p className="text-xs text-ice/40">Habilite para definir posições de jogo desta modalidade</p>
              </div>
              <button
                type="button"
                onClick={() => { setHasPositions(!hasPositions); setPositions([]); }}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${hasPositions ? 'bg-azure shadow-md shadow-azure/20' : 'bg-navy border border-azure/20'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 transform ${hasPositions ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {hasPositions && (
              <div className="space-y-3 mt-4">
                {/* Added positions */}
                {positions.length > 0 && (
                  <div className="space-y-1.5">
                    {positions.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-navy/50 border border-azure/10 rounded-lg px-3 py-2">
                        <span className="text-sm text-ice">
                          {p.name}
                          {p.abbreviation && <span className="text-ice/40 ml-2 text-xs">({p.abbreviation})</span>}
                        </span>
                        <button type="button" onClick={() => removePosition(i)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add position inputs */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={posInput.name}
                    onChange={(e) => setPosInput((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nome (ex: Atacante)"
                    className="flex-1 bg-navy border border-azure/20 rounded-lg px-3 py-2 text-sm text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
                  />
                  <input
                    type="text"
                    value={posInput.abbreviation}
                    onChange={(e) => setPosInput((p) => ({ ...p, abbreviation: e.target.value }))}
                    placeholder="Abrev."
                    className="w-20 bg-navy border border-azure/20 rounded-lg px-3 py-2 text-sm text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
                    maxLength={10}
                  />
                  <button
                    type="button"
                    onClick={addPosition}
                    className="px-3 py-2 bg-azure/10 border border-azure/30 text-azure rounded-lg text-sm hover:bg-azure hover:text-navy transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="w-full bg-azure text-navy font-bold py-3 rounded-lg hover:bg-ice transition-colors">
          Criar Modalidade
        </button>
      </form>
    </div>
  );
}

// ── Positions Manager (for existing modalities) ─────────────
function PositionsManager({ modality }: { modality: Modality }) {
  const [expanded, setExpanded] = useState(false);

  if (!modality.isTeamBased) return null;

  return (
    <div className="mt-3 border-t border-azure/5 pt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-azure/60 hover:text-azure transition-colors"
      >
        <span>{expanded ? '▾' : '▸'}</span>
        <span>Posições ({modality.positions.length})</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {modality.positions.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-navy/40 rounded px-3 py-1.5">
              <span className="text-sm text-ice/80">
                {p.name}
                {p.abbreviation && <span className="text-ice/30 ml-2 text-xs">({p.abbreviation})</span>}
              </span>
              <form action={deletePositionAction}>
                <input type="hidden" name="positionId" value={p.id} />
                <button type="submit" className="text-red-400/40 hover:text-red-400 text-xs transition-colors">✕</button>
              </form>
            </div>
          ))}
          {/* Add new position inline */}
          <form action={createPositionAction} className="flex gap-2 mt-2">
            <input type="hidden" name="modalityId" value={modality.id} />
            <input type="text" name="positionName" placeholder="Nova posição" required className="flex-1 bg-navy border border-azure/20 rounded px-3 py-1.5 text-xs text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors" />
            <input type="text" name="abbreviation" placeholder="Abrev." className="w-16 bg-navy border border-azure/20 rounded px-2 py-1.5 text-xs text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors" maxLength={10} />
            <button type="submit" className="px-2 py-1.5 bg-azure/10 border border-azure/30 text-azure rounded text-xs hover:bg-azure hover:text-navy transition-colors font-bold">+</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────
export default function ModalitiesClient({ modalities: initialModalities }: { modalities: Modality[] }) {
  const [confirmDeactivate, setConfirmDeactivate] = useState<Modality | null>(null);
  const [editModality, setEditModality] = useState<Modality | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const active = initialModalities.filter((m) => m.isActive);
  const inactive = initialModalities.filter((m) => !m.isActive);
  const displayed = showInactive ? inactive : active;

  return (
    <>
      {confirmDeactivate && <ConfirmModal modality={confirmDeactivate} onCancel={() => setConfirmDeactivate(null)} />}
      {editModality && <EditModal modality={editModality} onCancel={() => setEditModality(null)} />}

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-ice">Gestão de Modalidades</h2>
            <p className="text-ice/40 mt-1">Cadastre e gerencie os esportes suportados pelo Athlon.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInactive(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!showInactive ? 'bg-azure text-navy' : 'text-ice/40 hover:text-ice border border-azure/15 hover:border-azure/30'}`}
            >
              Ativas ({active.length})
            </button>
            <button
              onClick={() => setShowInactive(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showInactive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-ice/40 hover:text-ice border border-azure/15 hover:border-azure/30'}`}
            >
              Inativas ({inactive.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form */}
          {!showInactive && (
            <div className="xl:col-span-1">
              <CreateForm />
            </div>
          )}

          {/* List */}
          <div className={showInactive ? 'xl:col-span-3' : 'xl:col-span-2'}>
            <div className="bg-slate rounded-xl border border-azure/10 overflow-hidden">
              <div className="p-6 border-b border-azure/10 flex items-center justify-between">
                <h3 className="text-ice font-bold text-lg">
                  {showInactive ? 'Modalidades Inativas' : 'Modalidades Ativas'}
                </h3>
                <span className="text-xs text-azure/60 bg-azure/5 border border-azure/10 px-3 py-1 rounded-full">
                  {displayed.length} registros
                </span>
              </div>

              {displayed.length === 0 ? (
                <div className="p-12 text-center text-ice/30">
                  <span className="text-4xl block mb-3">{showInactive ? '✅' : '🎮'}</span>
                  {showInactive ? 'Nenhuma modalidade inativa.' : 'Nenhuma modalidade cadastrada ainda.'}
                </div>
              ) : (
                <div className="divide-y divide-azure/5">
                  {displayed.map((m) => (
                    <div key={m.id} className={`p-5 transition-colors ${m.isActive ? 'hover:bg-azure/5' : 'opacity-60'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <span className="text-2xl mt-0.5 flex-shrink-0">{m.isTeamBased ? '👥' : '🧍'}</span>
                          <div className="min-w-0">
                            <p className="text-ice font-semibold truncate">{m.name}</p>
                            <p className="text-xs text-ice/40 mt-0.5">
                              {m.isTeamBased ? 'Coletivo' : 'Individual'}
                              {m.description && ` · ${m.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {m.isActive ? (
                            <>
                              <button
                                onClick={() => setEditModality(m)}
                                className="text-xs text-azure/60 hover:text-azure transition-colors px-3 py-1.5 rounded-lg hover:bg-azure/10"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmDeactivate(m)}
                                className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10"
                              >
                                Desativar
                              </button>
                            </>
                          ) : (
                            <form action={reactivateModalityAction}>
                              <input type="hidden" name="id" value={m.id} />
                              <button type="submit" className="text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-400/10">
                                Reativar
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {m.isActive && <PositionsManager modality={m} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
