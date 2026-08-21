import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  invitePlayerAction,
  acceptJoinRequestAction,
  rejectInvitationAction,
  dismissPlayerAction,
  requestJoinAction,
  leaveClubAction,
} from '@/app/actions/clubs';
import { ConfirmButton } from '@/components/confirm-button';
import { Trophy as TrophyIcon } from 'lucide-react';

export default async function ClubManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);

  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  let clubData: any = null;
  
  try {
    clubData = await fetchApi(`/clubs/${clubId}/details`);
  } catch (e) {
    //
  }

  if (!clubData) notFound();

  const {
    club,
    clubTrophies = [],
    members = [],
    myPendingRequest,
    alreadyInSameModality,
    joinRequests = [],
    outgoingInvites = []
  } = clubData;

  const isPresident = club.presidentId === userId;
  const isMember = members.some((m: any) => m.userId === userId);

  // Group members by modality
  const byModality = (members as any[]).reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.modalityName]) acc[m.modalityName] = [];
    acc[m.modalityName].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/clubs"
            className="text-ice/40 hover:text-ice text-sm flex items-center gap-1 mb-3 transition-colors"
          >
            ← Meus Clubes
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-azure/10 border border-azure/20 flex items-center justify-center text-xl font-black text-azure">
              {club.tag}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-ice">{club.name}</h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-azure/10 border border-azure/20 rounded-lg shadow-[0_0_10px_rgba(0,163,255,0.1)]">
                  <span className="text-azure text-xs">⭐</span>
                  <span className="text-azure text-[10px] font-black uppercase tracking-widest">{club.prestigePoints} PRESTÍGIO</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {club.location && (
                  <p className="text-ice/40 text-sm">📍 {club.location}</p>
                )}
                <span className="h-1 w-1 rounded-full bg-ice/10"></span>
                <p className="text-azure/60 text-[10px] font-black uppercase tracking-widest italic">{club.modality?.name}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {isMember && !isPresident && (
            <form action={leaveClubAction}>
              <input type="hidden" name="clubId" value={clubId} />
              <ConfirmButton
                type="submit"
                confirmMessage="Tem certeza que deseja sair do clube?"
                className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 px-4 py-2 rounded-lg font-bold transition-all"
              >
                🚪 Sair do Clube
              </ConfirmButton>
            </form>
          )}
          <Link
            href={`/dashboard/clubs`}
            className="text-xs text-azure/60 hover:text-azure border border-azure/20 hover:border-azure/40 px-3 py-2 rounded-lg transition-colors flex items-center"
          >
            Voltar
          </Link>
        </div>
      </div>

      {/* Request to Join (Visitor mode) */}
      {!isMember && !isPresident && !alreadyInSameModality && (
        <div className="bg-slate rounded-xl border border-azure/10 p-6">
          {myPendingRequest ? (
            <div className="text-center py-2">
              <p className="text-amber-400 font-bold">⏳ Pedido de entrada enviado</p>
              <p className="text-ice/40 text-sm mt-1">
                Aguardando aprovação do presidente do clube.
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-ice font-bold text-lg">Gostaria de entrar para o clube?</h3>
                <p className="text-ice/40 text-sm">Envie uma solicitação para participar da nossa equipe.</p>
              </div>
              <form action={requestJoinAction} className="flex gap-2 flex-wrap">
                <input type="hidden" name="clubId" value={clubId} />
                <button
                  type="submit"
                  className="bg-azure text-midnight font-black text-xs uppercase px-8 py-3 rounded-lg hover:bg-azure/80 transition-transform active:scale-95 shadow-lg shadow-azure/10"
                >
                  ✋ Solicitar Entrada
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Join Requests */}
      {joinRequests.length > 0 && (
        <div className="bg-slate rounded-xl border border-emerald-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-widest">
              Pedidos de Entrada ({joinRequests.length})
            </h3>
          </div>
          <div className="space-y-3">
            {joinRequests.map((req: any) => (
              <div
                key={req.inviteId}
                className="flex items-center justify-between bg-midnight/40 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-ice font-semibold">
                    {req.userName}
                    {req.userNickname && (
                      <span className="text-azure text-sm ml-2 font-mono">@{req.userNickname}</span>
                    )}
                  </p>
                  <p className="text-ice/50 text-sm mt-0.5">
                    Modalidade: <span className="text-azure">{req.modalityName}</span>
                    {req.message && (
                      <span className="text-ice/30"> — &quot;{req.message}&quot;</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={acceptJoinRequestAction}>
                    <input type="hidden" name="invitationId" value={req.inviteId} />
                    <button
                      type="submit"
                      className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      ✓ Aprovar
                    </button>
                  </form>
                  <form action={rejectInvitationAction}>
                    <input type="hidden" name="invitationId" value={req.inviteId} />
                    <button
                      type="submit"
                      className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      ✕ Recusar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite CTA (President only) */}
      {isPresident && (
        <div className="bg-slate rounded-xl border border-azure/20 p-8 flex flex-col items-center text-center shadow-lg shadow-azure/5">
          <div className="w-16 h-16 rounded-full bg-azure/10 flex items-center justify-center text-3xl mb-4">
            🔎
          </div>
          <h3 className="text-ice font-bold text-xl mb-2">Procurando Reforços?</h3>
          <p className="text-ice/40 text-sm max-w-md mb-6">
            Visite nosso Mercado de Jogadores para encontrar talentos filtrados por modalidade e posição. Convide-os diretamente de seus perfis.
          </p>
          <Link
            href="/dashboard/players"
            className="bg-azure hover:bg-azure/80 text-midnight font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-azure/10"
          >
            Explorar Mercado de Jogadores
          </Link>
        </div>
      )}

      {/* Hall de Troféus do Clube */}
      <div className="bg-slate rounded-xl border border-azure/10 p-8 overflow-hidden relative shadow-2xl">
        <div className="absolute -top-10 -right-10 opacity-5 rotate-12">
           <TrophyIcon size={180} />
        </div>
        <h3 className="text-ice font-black text-xl mb-8 flex items-center gap-3">
          <span className="p-2 bg-amber-500/20 rounded-2xl text-amber-500 shadow-lg shadow-amber-500/10">🏆</span>
          Galeria de Conquistas
        </h3>
        
        {clubTrophies.length === 0 ? (
          <div className="border-2 border-dashed border-azure/5 rounded-[2rem] p-12 text-center">
             <p className="text-ice/20 text-sm font-black uppercase tracking-widest italic">Nenhuma conquista oficial registrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
            {clubTrophies.map((t: any) => (
              <div key={t.id} className="bg-midnight/60 border border-amber-500/10 rounded-[1.5rem] p-6 text-center group hover:border-amber-500/40 transition-all shadow-xl hover:-translate-y-1 duration-500">
                <div className="h-14 w-14 bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform">
                  <TrophyIcon size={24} className="text-amber-500" />
                </div>
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-2">
                  {t.type === 'champion' ? 'Campeão' : 
                   t.type === 'runner_up' ? 'Vice-Campeão' : 
                   t.type === 'third' ? '3º Lugar' : 'Destaque'}
                </p>
                <p className="text-[10px] text-ice/40 uppercase font-black truncate tracking-tighter italic">{t.competition.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster grouped by modality */}
      <div className="space-y-6">
        <h3 className="text-ice font-black text-xl flex items-center gap-2">
          👥 Elenco do Clube
        </h3>
        {Object.entries(byModality).map(([modalityName, modalityMembers]) => (
          <div key={modalityName} className="bg-slate rounded-xl border border-azure/10 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-azure/10 flex items-center justify-between bg-midnight/20">
              <h4 className="text-ice font-bold flex items-center gap-2">
                <span className="text-azure">🎮</span> {modalityName}
              </h4>
              <span className="text-[10px] text-ice/30 uppercase tracking-widest font-black">
                {modalityMembers.length} Jogador{modalityMembers.length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-midnight/40">
                    <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest">Posição</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest">Jogador</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest whitespace-nowrap">Função</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest text-center">Estatísticas</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-azure/5">
                  {modalityMembers.map((m: any) => (
                    <tr key={m.memberId} className="hover:bg-azure/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {m.primaryPosition ? (
                          <span className="text-xs bg-azure/5 text-azure px-2 py-1 rounded border border-azure/10 font-mono" title={m.primaryPosition.name}>
                            {m.primaryPosition.abbreviation || m.primaryPosition.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-ice/20 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-azure/10 flex items-center justify-center text-xs font-bold text-azure shrink-0">
                            {m.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-ice text-sm font-semibold group-hover:text-azure transition-colors truncate max-w-[120px]">{m.userName}</p>
                            {m.userNickname && <p className="text-azure/40 text-[10px] font-mono leading-none mt-0.5">@{m.userNickname}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-tighter ${
                            m.userId === club.presidentId
                              ? 'bg-amber-500/15 text-amber-400'
                              : m.role === 'captain'
                              ? 'bg-azure/15 text-azure'
                              : 'bg-ice/5 text-ice/40'
                          }`}
                        >
                          {m.userId === club.presidentId ? '👑 Presidente' : m.role === 'captain' ? '⚡ Capitão' : 'Jogador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-ice/60 font-mono">0 J</span>
                          <div className="flex gap-1.5">
                             <span className="text-[9px] text-emerald-400/80 font-bold">0V</span>
                             <span className="text-[9px] text-rose-400/80 font-bold">0D</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isPresident && m.userId !== club.presidentId ? (
                          <form action={dismissPlayerAction}>
                            <input type="hidden" name="memberId" value={m.memberId} />
                            <input type="hidden" name="clubId" value={clubId} />
                            <ConfirmButton
                              type="submit"
                              confirmMessage={`Tem certeza que deseja dispensar ${m.userName}?`}
                              className="text-[10px] font-bold text-rose-400/50 hover:text-rose-400 border border-rose-500/0 hover:border-rose-500/30 px-3 py-1.5 rounded uppercase tracking-widest transition-all hover:bg-rose-500/5"
                            >
                              Dispensar
                            </ConfirmButton>
                          </form>
                        ) : (
                          <span className="text-[10px] text-ice/10 uppercase tracking-widest font-black">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="bg-slate rounded-xl border border-azure/10 p-12 text-center text-ice/20 font-bold uppercase tracking-widest italic">
            Nenhum membro no elenco até o momento.
          </div>
        )}
      </div>

      {/* Outgoing Invites */}
      {outgoingInvites.length > 0 && (
        <div className="bg-slate rounded-xl border border-azure/10 p-6 opacity-60">
          <h3 className="text-ice font-semibold mb-3 text-sm uppercase tracking-widest">
            Convites Aguardando Resposta ({outgoingInvites.length})
          </h3>
          <div className="space-y-2">
            {outgoingInvites.map((inv: any) => (
              <div
                key={inv.inviteId}
                className="flex items-center justify-between bg-midnight/40 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-ice text-sm font-semibold">
                    {inv.userName}
                    {inv.userNickname && (
                      <span className="text-azure text-xs ml-2 font-mono">@{inv.userNickname}</span>
                    )}
                  </p>
                  <p className="text-ice/40 text-[10px] mt-0.5 uppercase font-bold">{inv.modalityName}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded uppercase tracking-tighter">
                  Pendente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
