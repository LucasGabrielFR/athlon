import { auth } from '@/auth';
import { db } from '@/db';
import { clubs, clubMembers, clubInvitations, users, modalities, positions, playerModalities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requestJoinAction } from '@/app/actions/clubs';

export default async function ClubShowcasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);

  const session = await auth();
  const userId = session?.user
    ? Number((session.user as { id?: string | number }).id)
    : null;

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
  });
  if (!club) notFound();

  // Members with positions
  const members = await db
    .select({
      memberId: clubMembers.id,
      userId: clubMembers.userId,
      role: clubMembers.role,
      joinedAt: clubMembers.joinedAt,
      userName: users.name,
      userNickname: users.nickname,
      userImage: users.image,
      modalityName: modalities.name,
      modalityId: modalities.id,
      primaryPosition: {
        name: positions.name,
        abbreviation: positions.abbreviation,
      },
    })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .innerJoin(modalities, eq(clubMembers.modalityId, modalities.id))
    .leftJoin(playerModalities, and(
      eq(playerModalities.userId, clubMembers.userId),
      eq(playerModalities.modalityId, clubMembers.modalityId)
    ))
    .leftJoin(positions, eq(playerModalities.primaryPositionId, positions.id))
    .where(eq(clubMembers.clubId, clubId));

  // Is the visitor already a member?
  const myMembership = userId
    ? await db.query.clubMembers.findFirst({
        where: and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)),
      })
    : null;

  // Has a pending request?
  const myPendingRequest = userId
    ? await db.query.clubInvitations.findFirst({
        where: and(
          eq(clubInvitations.clubId, clubId),
          eq(clubInvitations.userId, userId),
          eq(clubInvitations.type, 'request'),
          eq(clubInvitations.status, 'pending'),
        ),
      })
    : null;

  // Active modalities for the request form
  const activeModalities = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
  });

  // Group members by modality
  const byModality = members.reduce<Record<string, typeof members>>((acc, m) => {
    if (!acc[m.modalityName]) acc[m.modalityName] = [];
    acc[m.modalityName].push(m);
    return acc;
  }, {});

  const isPresident = club.presidentId === userId;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="bg-slate rounded-2xl border border-azure/10 p-8">
        <div className="flex items-start gap-6">
          {club.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={club.logoUrl}
              alt={`${club.name} escudo`}
              className="w-20 h-20 rounded-full object-cover border-2 border-azure/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-azure/10 border-2 border-azure/20 flex items-center justify-center text-2xl font-black text-azure">
              {club.tag}
            </div>
          )}
          <div className="flex-1">
            <p className="text-azure/60 font-mono text-sm">[{club.tag}]</p>
            <h1 className="text-4xl font-black text-ice mt-0.5">{club.name}</h1>
            {club.location && (
              <p className="text-ice/40 text-sm mt-1">📍 {club.location}</p>
            )}
            <p className="text-ice/30 text-xs mt-2">
              Fundado em{' '}
              {club.createdAt
                ? new Date(club.createdAt).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          {isPresident && (
            <Link
              href={`/dashboard/clubs/${clubId}`}
              className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 px-3 py-2 rounded-lg font-semibold transition-colors"
            >
              ⚙️ Gerenciar
            </Link>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-azure/10">
          <div>
            <p className="text-2xl font-black text-ice">{members.length}</p>
            <p className="text-[10px] text-ice/40 uppercase tracking-widest font-bold">Membros</p>
          </div>
          <div>
            <p className="text-2xl font-black text-ice">{Object.keys(byModality).length}</p>
            <p className="text-[10px] text-ice/40 uppercase tracking-widest font-bold">Modalidades</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">0</p>
            <p className="text-[10px] text-ice/40 uppercase tracking-widest font-bold">Títulos</p>
          </div>
          <div>
            <p className="text-2xl font-black text-azure">0%</p>
            <p className="text-[10px] text-ice/40 uppercase tracking-widest font-bold">Winrate</p>
          </div>
        </div>
      </div>

      {/* Request to Join — for non-members only */}
      {userId && !myMembership && !isPresident && (
        <div className="bg-slate rounded-xl border border-azure/10 p-6">
          {myPendingRequest ? (
            <div className="text-center py-2">
              <p className="text-amber-400 font-semibold">⏳ Pedido de entrada enviado</p>
              <p className="text-ice/40 text-sm mt-1">
                Aguardando aprovação do presidente do clube.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-ice font-bold mb-4">Solicitar Entrada</h3>
              <form action={requestJoinAction} className="flex gap-3 flex-wrap">
                <input type="hidden" name="clubId" value={clubId} />
                <select
                  name="modalityId"
                  required
                  className="flex-1 min-w-[160px] bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2.5 focus:outline-none focus:border-azure/50 text-sm"
                >
                  <option value="">Selecione a modalidade...</option>
                  {activeModalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  name="message"
                  placeholder="Mensagem (opcional)"
                  className="flex-1 min-w-[180px] bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2.5 placeholder-ice/20 focus:outline-none focus:border-azure/50 text-sm"
                />
                <button
                  type="submit"
                  className="bg-azure text-midnight font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-azure/80 transition-colors whitespace-nowrap"
                >
                  ✋ Solicitar Entrada
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Roster by modality */}
      {Object.entries(byModality).map(([modalityName, modalityMembers]) => (
        <div key={modalityName} className="bg-slate rounded-xl border border-azure/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-azure/10 flex items-center justify-between bg-midnight/20">
            <h3 className="text-ice font-bold text-lg flex items-center gap-2">
              <span className="text-azure">🎮</span> {modalityName}
            </h3>
            <span className="text-xs text-ice/30 uppercase tracking-widest font-bold">
              {modalityMembers.length} Jogador{modalityMembers.length !== 1 ? 'es' : ''}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-midnight/40">
                  <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest whitespace-nowrap">Posição</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest whitespace-nowrap">Jogador</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest whitespace-nowrap">Nick</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-ice/40 uppercase tracking-widest whitespace-nowrap text-right">Estatísticas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-azure/5">
                {modalityMembers.map((m) => (
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
                        <span className="text-ice text-sm font-semibold group-hover:text-azure transition-colors">
                          {m.userName}
                          {m.userId === club.presidentId && <span className="ml-2" title="Presidente">👑</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-azure/60">
                      {m.userNickname ? `@${m.userNickname}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-ice/60">0 Partidas</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-emerald-400">0V</span>
                          <span className="text-[10px] text-rose-400">0D</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {members.length === 0 && (
        <div className="text-center py-8 text-ice/30">
          <p className="text-3xl mb-2">👥</p>
          <p>Nenhum membro no elenco ainda.</p>
        </div>
      )}
    </div>
  );
}
