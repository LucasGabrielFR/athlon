import { auth } from '@/auth';
import { db } from '@/db';
import { clubs, clubMembers, clubInvitations, modalities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from '@/app/actions/clubs';

export default async function ClubsPage() {
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  // Which clubs the user belongs to
  const myMemberships = await db.query.clubMembers.findMany({
    where: eq(clubMembers.userId, userId),
    with: { club: true, modality: true },
  });

  // Which clubs the user presides over
  const presidedClubs = myMemberships.filter((m) => m.role === 'president');

  // Pending invites (president invited this player)
  const pendingInvites = await db.query.clubInvitations.findMany({
    where: (inv) =>
      eq(inv.userId, userId) &&
      eq(inv.type, 'invite') &&
      eq(inv.status, 'pending'),
    with: { club: true, modality: true },
  });

  // Check if user presides a club (any)
  const isPresident = presidedClubs.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-ice">Meus Clubes</h2>
          <p className="text-ice/40 mt-1">Gerencie seu vínculo com os clubes da plataforma.</p>
        </div>
        {!isPresident && (
          <Link
            href="/dashboard/clubs/new"
            className="flex items-center gap-2 bg-azure text-midnight font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-azure/80 transition-colors"
          >
            <span>🛡️</span>
            Fundar um Clube
          </Link>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-slate rounded-xl border border-amber-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest">
              Convites Pendentes ({pendingInvites.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-midnight/40 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-ice font-semibold">
                    {invite.club.name}{' '}
                    <span className="text-ice/40 text-xs font-mono">[{invite.club.tag}]</span>
                  </p>
                  <p className="text-ice/50 text-sm mt-0.5">
                    Modalidade: <span className="text-azure">{invite.modality.name}</span>
                    {invite.message && (
                      <span className="text-ice/30"> — &quot;{invite.message}&quot;</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={acceptInvitationAction}>
                    <input type="hidden" name="invitationId" value={invite.id} />
                    <button
                      type="submit"
                      className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      ✓ Aceitar
                    </button>
                  </form>
                  <form action={rejectInvitationAction}>
                    <input type="hidden" name="invitationId" value={invite.id} />
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

      {/* My Clubs Grid */}
      {myMemberships.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {myMemberships.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/clubs/${m.club.id}`}
              className="bg-slate border border-azure/10 hover:border-azure/30 rounded-xl p-5 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-full bg-azure/10 border border-azure/20 flex items-center justify-center text-xl font-black text-azure"
                >
                  {m.club.tag}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${
                    m.role === 'president'
                      ? 'bg-amber-500/15 text-amber-400'
                      : m.role === 'captain'
                      ? 'bg-azure/15 text-azure'
                      : 'bg-ice/5 text-ice/50'
                  }`}
                >
                  {m.role === 'president' ? '👑 Presidente' : m.role === 'captain' ? '⚡ Capitão' : 'Jogador'}
                </span>
              </div>
              <h4 className="text-ice font-bold text-lg group-hover:text-azure transition-colors">
                {m.club.name}
              </h4>
              <p className="text-ice/40 text-sm mt-0.5">{m.modality.name}</p>
              {m.club.location && (
                <p className="text-ice/30 text-xs mt-2">📍 {m.club.location}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-slate rounded-xl border border-dashed border-azure/20 p-12 text-center">
          <p className="text-4xl mb-3">🛡️</p>
          <p className="text-ice font-semibold text-lg">Nenhum clube ainda</p>
          <p className="text-ice/40 text-sm mt-1 mb-5">
            Funde seu próprio clube ou aguarde um convite de outro presidente.
          </p>
          <Link
            href="/dashboard/clubs/new"
            className="inline-flex items-center gap-2 bg-azure/20 text-azure border border-azure/30 hover:bg-azure/30 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            🛡️ Fundar meu Clube
          </Link>
        </div>
      )}
    </div>
  );
}
