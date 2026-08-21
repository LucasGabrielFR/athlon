/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { submitMatchReportAction, acceptMatchSubmissionAction, disputeMatchSubmissionAction } from '@/app/actions/competitions';
import { CheckCircle2, AlertTriangle, ShieldCheck, Camera } from 'lucide-react';

export function MatchReportForm({
  match,
  requirements,
  screenshots,
  isAdmin,
  isHomeManager,
  isAwayManager,
  comp
}: {
  match: any;
  requirements: any[];
  screenshots: any[];
  isAdmin: boolean;
  isHomeManager: boolean;
  isAwayManager: boolean;
  comp: any;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore || 0);
  const [awayScore, setAwayScore] = useState(match.awayScore || 0);

  const canSubmit = isAdmin || isHomeManager || isAwayManager;
  const isReadOnly = match.isValidated || (!isAdmin && (
    (match.submissionStatus === 'submitted_by_home' && isAwayManager) ||
    (match.submissionStatus === 'submitted_by_away' && isHomeManager) ||
    match.submissionStatus === 'disputed'
  ));

  const showApprovalOptions = !isAdmin && (
    (match.submissionStatus === 'submitted_by_home' && isAwayManager) ||
    (match.submissionStatus === 'submitted_by_away' && isHomeManager)
  );

  return (
    <div className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-8">
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 bg-azure/10 text-azure rounded-xl flex items-center justify-center">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h3 className="text-xl font-black text-ice italic">Súmula da Partida</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-azure/50 mt-1">
            Status: {match.submissionStatus.toUpperCase().replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {showApprovalOptions ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-amber-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-500">Súmula enviada pelo adversário</h4>
              <p className="text-xs text-ice/60 mt-1">
                O adversário reportou que o placar foi: {match.homeScore} x {match.awayScore}.
                Verifique as imagens anexadas abaixo e confirme se o resultado é verdadeiro.
              </p>
            </div>
          </div>
          
          {/* Mostrar Imagens Enviadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {screenshots.map(s => (
              <div key={s.id} className="relative group overflow-hidden rounded-xl border border-azure/20">
                <img src={s.mediaUrl} alt="Print da Partida" className="w-full object-cover aspect-video" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={s.mediaUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-azure bg-slate-dark px-4 py-2 rounded-lg">Ampliar</a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <form action={async (data) => { await acceptMatchSubmissionAction(data); }} className="flex-1">
              <input type="hidden" name="matchId" value={match.id} />
              <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-slate font-black py-4 rounded-xl uppercase tracking-widest text-[10px] transition-all">
                Confirmar Resultado
              </button>
            </form>
            <form action={async (data) => { await disputeMatchSubmissionAction(data); }} className="flex-1">
              <input type="hidden" name="matchId" value={match.id} />
              <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-slate font-black py-4 rounded-xl uppercase tracking-widest text-[10px] transition-all">
                Contestar (Disputar)
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={async (data) => { await submitMatchReportAction(data); }} className="space-y-8">
          <input type="hidden" name="matchId" value={match.id} />

          {/* Score Input */}
          <div className="grid grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ice/40 pl-1">{match.homeRegistration.club.name} (Casa)</label>
              <input 
                type="number" 
                name="homeScore"
                value={homeScore}
                onChange={e => setHomeScore(Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full bg-slate-dark border border-azure/20 text-ice text-3xl font-black italic text-center py-4 rounded-2xl focus:border-azure focus:outline-none disabled:opacity-50" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ice/40 pl-1 text-right block">{match.awayRegistration.club.name} (Fora)</label>
              <input 
                type="number" 
                name="awayScore"
                value={awayScore}
                onChange={e => setAwayScore(Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full bg-slate-dark border border-azure/20 text-ice text-3xl font-black italic text-center py-4 rounded-2xl focus:border-azure focus:outline-none disabled:opacity-50" 
              />
            </div>
          </div>

          {/* Screenshot Requirements */}
          {requirements.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-ice flex items-center gap-2">
                <Camera size={14} className="text-azure" /> Anexos Obrigatórios
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((req, i) => {
                  const existingScreenshot = screenshots.find(s => s.requirementId === req.id);
                  return (
                    <div key={req.id} className="bg-slate-dark/50 border border-azure/10 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-azure uppercase tracking-widest mb-3">{req.title}</p>
                      {existingScreenshot ? (
                        <div className="relative group rounded-xl overflow-hidden border border-azure/20">
                          <img src={existingScreenshot.mediaUrl} alt={req.title} className="w-full aspect-video object-cover" />
                          <input type="hidden" name="requirementId" value={req.id} />
                          <input type="hidden" name="mediaUrl" value={existingScreenshot.mediaUrl} />
                          {!isReadOnly && (
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                              <ImageUpload name={`req_media_${req.id}`} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-32">
                          <input type="hidden" name="requirementId" value={req.id} />
                          {!isReadOnly ? (
                            <ImageUpload name={`req_media_${req.id}`} />
                          ) : (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-azure/10 rounded-xl text-[10px] uppercase font-black text-ice/20">Não enviado</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isReadOnly && canSubmit && (
            <button type="submit" className="w-full bg-azure hover:bg-azure-dark text-slate font-black py-4 rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-azure/10 transition-all flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Enviar Súmula
            </button>
          )}

          {isAdmin && match.submissionStatus !== 'validated' && (
             <div className="pt-4 border-t border-azure/10">
                <button type="submit" name="forceValidate" value="true" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate font-black py-4 rounded-2xl uppercase tracking-[0.2em] shadow-xl transition-all">
                  Validar Forçadamente (Admin)
                </button>
             </div>
          )}
        </form>
      )}
    </div>
  );
}
