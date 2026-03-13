import { auth } from '@/auth';
import { db } from '@/db';
import { clubs, clubMembers, clubInvitations, users, modalities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  invitePlayerAction,
  acceptJoinRequestAction,
  rejectInvitationAction,
  dismissPlayerAction,
} from '@/app/actions/clubs';

export default async function ClubManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);

  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  // Load club
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
  });
  if (!club) notFound();

  // Only the president can access this page
  if (club.presidentId !== userId) redirect(`/clubs/${clubId}`);

  // Club members grouped by modality
  const members = await db
    .select({
      memberId: clubMembers.id,
      role: clubMembers.role,
      joinedAt: clubMembers.joinedAt,
      userId: clubMembers.userId,
      userName: users.name,
      userNickname: users.nickname,
      modalityId: modalities.id,
      modalityName: modalities.name,
    })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .innerJoin(modalities, eq(clubMembers.modalityId, modalities.id))
    .where(eq(clubMembers.clubId, clubId));

  // Pending join requests (players who want in)
  const joinRequests = await db
    .select({
      inviteId: clubInvitations.id,
      message: clubInvitations.message,
      createdAt: clubInvitations.createdAt,
      userId: clubInvitations.userId,
      userName: users.name,
      userNickname: users.nickname,
      modalityId: modalities.id,
      modalityName: modalities.name,
    })
    .from(clubInvitations)
    .innerJoin(users, eq(clubInvitations.userId, users.id))
    .innerJoin(modalities, eq(clubInvitations.modalityId, modalities.id))
    .where(
      and(
        eq(clubInvitations.clubId, clubId),
        eq(clubInvitations.type, 'request'),
        eq(clubInvitations.status, 'pending'),
      ),
    );

  // Pending outgoing invites (president invited a player waiting for them)
  const outgoingInvites = await db
    .select({
      inviteId: clubInvitations.id,
      message: clubInvitations.message,
      createdAt: clubInvitations.createdAt,
      userId: clubInvitations.userId,
      userName: users.name,
      userNickname: users.nickname,
      modalityId: modalities.id,
      modalityName: modalities.name,
    })
    .from(clubInvitations)
    .innerJoin(users, eq(clubInvitations.userId, users.id))
    .innerJoin(modalities, eq(clubInvitations.modalityId, modalities.id))
    .where(
      and(
        eq(clubInvitations.clubId, clubId),
        eq(clubInvitations.type, 'invite'),
        eq(clubInvitations.status, 'pending'),
      ),
    );

  // All modalities for invite form
  const allModalities = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
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
              <h2 className="text-3xl font-bold text-ice">{club.name}</h2>
              {club.location && (
                <p className="text-ice/40 text-sm mt-0.5">📍 {club.location}</p>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/clubs/${clubId}`}
          className="text-xs text-azure/60 hover:text-azure border border-azure/20 hover:border-azure/40 px-3 py-2 rounded-lg transition-colors"
        >
          Ver Vitrine Pública ↗
        </Link>
      </div>

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
            {joinRequests.map((req) => (
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

      {/* Invite Player Form */}
      <div className="bg-slate rounded-xl border border-azure/10 p-6">
        <h3 className="text-ice font-bold text-lg mb-4">Convidar Jogador</h3>
        <form action={invitePlayerAction} className="space-y-4">
          <input type="hidden" name="clubId" value={clubId} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-ice/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                ID do Jogador
              </label>
              <input
                name="targetUserId"
                type="number"
                required
                placeholder="ex: 42"
                className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2.5 placeholder-ice/20 focus:outline-none focus:border-azure/50 text-sm transition-colors"
              />
              <p className="text-ice/30 text-xs mt-1">User ID numérico do jogador.</p>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-ice/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Modalidade
              </label>
              <select
                name="modalityId"
                required
                className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2.5 focus:outline-none focus:border-azure/50 text-sm transition-colors"
              >
                <option value="">Selecione...</option>
                {allModalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-ice/50 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Mensagem <span className="text-ice/30 normal-case">(opcional)</span>
              </label>
              <input
                name="message"
                placeholder="ex: Temos uma vaga de goleiro"
                className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2.5 placeholder-ice/20 focus:outline-none focus:border-azure/50 text-sm transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-azure text-midnight font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-azure/80 transition-colors"
            >
              📨 Enviar Convite
            </button>
          </div>
        </form>
      </div>

      {/* Outgoing Invites */}
      {outgoingInvites.length > 0 && (
        <div className="bg-slate rounded-xl border border-azure/10 p-6">
          <h3 className="text-ice font-semibold mb-3">
            Convites Aguardando Resposta ({outgoingInvites.length})
          </h3>
          <div className="space-y-2">
            {outgoingInvites.map((inv) => (
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
                  <p className="text-ice/40 text-xs mt-0.5">{inv.modalityName}</p>
                </div>
                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                  Aguardando...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roster */}
      <div className="bg-slate rounded-xl border border-azure/10 p-6">
        <h3 className="text-ice font-bold text-lg mb-4">
          Elenco ({members.length} membro{members.length !== 1 ? 's' : ''})
        </h3>
        {members.length === 0 ? (
          <p className="text-ice/30 text-sm text-center py-6">
            Nenhum membro ainda. Use o formulário acima para convidar jogadores.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.memberId}
                className="flex items-center justify-between bg-midnight/40 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-ice text-sm font-semibold">
                    {m.userName}
                    {m.userNickname && (
                      <span className="text-azure text-xs ml-2 font-mono">@{m.userNickname}</span>
                    )}
                  </p>
                  <p className="text-ice/40 text-xs mt-0.5">{m.modalityName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      m.role === 'president'
                        ? 'bg-amber-500/15 text-amber-400'
                        : m.role === 'captain'
                        ? 'bg-azure/15 text-azure'
                        : 'bg-ice/5 text-ice/40'
                    }`}
                  >
                    {m.role === 'president' ? '👑 Presidente' : m.role === 'captain' ? '⚡ Capitão' : 'Jogador'}
                  </span>
                  {m.role !== 'president' && (
                    <form action={dismissPlayerAction}>
                      <input type="hidden" name="memberId" value={m.memberId} />
                      <input type="hidden" name="clubId" value={clubId} />
                      <button
                        type="submit"
                        className="text-xs text-rose-400/60 hover:text-rose-400 border border-rose-500/0 hover:border-rose-500/30 px-2 py-1 rounded transition-colors"
                        title="Dispensar jogador"
                      >
                        Dispensar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
