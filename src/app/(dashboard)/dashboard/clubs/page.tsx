import { auth } from '@/auth';
import { db } from '@/db';
import { clubs, clubMembers, clubInvitations, modalities, users } from '@/db/schema';
import { eq, and, or, sql, desc, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from '@/app/actions/clubs';
import { ClubFilters } from './ClubFilters';

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as any).id);

  const params = await searchParams;
  const modalityFilter = params.modality ? Number(params.modality) : undefined;
  const searchFilter = params.q as string | undefined;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  // 1. My Entities (Membership & Invitations)
  const myMemberships = await db.query.clubMembers.findMany({
    where: eq(clubMembers.userId, userId),
    with: { club: true, modality: true },
  });

  const presidedClubs = myMemberships.filter((m) => m.role === 'president');
  const isPresident = presidedClubs.length > 0;

  const pendingInvites = await db.query.clubInvitations.findMany({
    where: (inv) =>
      eq(inv.userId, userId) &&
      eq(inv.type, 'invite') &&
      eq(inv.status, 'pending'),
    with: { club: true, modality: true },
  });

  // 2. All Modalities for filter
  const allModalities = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
    orderBy: (m, { asc }) => [asc(m.name)],
  });

  // 3. Explorer: Filtering logic
  const explorerConditions = [];
  if (modalityFilter) {
    explorerConditions.push(eq(clubs.modalityId, modalityFilter));
  }
  if (searchFilter) {
    explorerConditions.push(or(
      sql`${clubs.name} LIKE ${`%${searchFilter}%`}`,
      sql`${clubs.tag} LIKE ${`%${searchFilter}%`}`
    ) as any);
  }

  // Count total clubs for pagination
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(clubs)
    .where(explorerConditions.length > 0 ? and(...explorerConditions) : undefined);
  
  const totalItemsResult = await countQuery;
  const totalItems = Number(totalItemsResult[0].count);
  const totalPages = Math.ceil(totalItems / pageSize);

  // Fetch paginated clubs
  const allClubs = await db.query.clubs.findMany({
    where: explorerConditions.length > 0 ? and(...explorerConditions) : undefined,
    with: { modality: true, president: true },
    limit: pageSize,
    offset: offset,
    orderBy: [desc(clubs.createdAt)],
  });

  const getPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (modalityFilter) sp.set('modality', modalityFilter.toString());
    if (searchFilter) sp.set('q', searchFilter);
    sp.set('page', p.toString());
    return `?${sp.toString()}`;
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-ice tracking-tight">Cenário de <span className="text-azure">Clubes</span></h2>
          <p className="text-ice/40 mt-1">Descubra as organizações que dominam a plataforma.</p>
        </div>
        {!isPresident && (
          <Link
            href="/dashboard/clubs/new"
            className="bg-azure hover:bg-azure-dark text-slate font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-azure/20 flex items-center gap-2 text-sm uppercase tracking-tighter"
          >
            <span>🛡️</span> Fundar Clube
          </Link>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-slate/40 rounded-2xl border border-amber-500/20 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse ring-4 ring-amber-400/10" />
            <h3 className="text-amber-400 font-black text-xs uppercase tracking-[0.2em]">
              Convites Pendentes ({pendingInvites.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-midnight/60 border border-amber-500/10 rounded-xl p-4 group"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center font-black text-amber-500 text-xs">
                     {invite.club.tag}
                   </div>
                   <div>
                     <p className="text-ice font-bold text-sm">{invite.club.name}</p>
                     <p className="text-ice/40 text-[10px] uppercase font-bold tracking-widest">{invite.modality?.name || 'N/A'}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <form action={acceptInvitationAction}>
                    <input type="hidden" name="invitationId" value={invite.id} />
                    <button
                      type="submit"
                      className="bg-emerald-500 text-slate text-[10px] font-black px-3 py-2 rounded-lg hover:bg-emerald-400 transition-colors uppercase tracking-tighter"
                    >
                      Aceitar
                    </button>
                  </form>
                  <form action={rejectInvitationAction}>
                    <input type="hidden" name="invitationId" value={invite.id} />
                    <button
                      type="submit"
                      className="bg-midnight border border-rose-500/30 text-rose-400 text-[10px] font-black px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors uppercase tracking-tighter"
                    >
                      Recusar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Memberships */}
      {myMemberships.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xs font-black text-azure uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-azure"></span> Meus Clubes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myMemberships.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/clubs/${m.club.id}`}
                className="bg-slate border border-azure/10 hover:border-azure/40 rounded-2xl p-6 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                   <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                     m.role === 'president' ? 'bg-amber-500/20 text-amber-500' : 'bg-azure/20 text-azure'
                   }`}>
                     {m.role === 'president' ? 'Presidente' : 'Membro'}
                   </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-midnight border border-azure/10 flex items-center justify-center text-xl font-black text-azure mb-4 group-hover:scale-110 transition-transform">
                  {m.club.tag}
                </div>
                <h4 className="text-ice font-bold text-lg mb-1 group-hover:text-azure transition-colors line-clamp-1">{m.club.name}</h4>
                <p className="text-ice/30 text-[10px] uppercase font-black tracking-widest">{m.modality?.name || 'N/A'}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Explorer Section */}
      <div className="space-y-8 pt-8 border-t border-azure/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-xs font-black text-ice/40 uppercase tracking-[0.3em]">Explorar Mundo</h3>
            <h4 className="text-2xl font-black text-ice tracking-tight mt-1 italic uppercase underline decoration-azure underline-offset-8 decoration-4">Descobrir Clubes</h4>
          </div>
        </div>

        <ClubFilters 
          modalities={allModalities.map(m => ({ id: m.id, name: m.name }))}
          initialFilters={{
            modality: modalityFilter,
            search: searchFilter,
          }}
        />

        {allClubs.length === 0 ? (
          <div className="bg-midnight/40 rounded-2xl border border-dashed border-azure/10 py-16 text-center">
            <p className="text-4xl mb-4 grayscale opacity-40">🏟️</p>
            <p className="text-ice/40 italic">Nenhum clube encontrado nos registros.</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/dashboard/clubs/${club.id}`}
                  className="bg-slate/30 border border-azure/5 hover:border-azure/20 rounded-2xl p-6 transition-all hover:bg-slate group"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-midnight flex items-center justify-center text-lg font-black text-azure/60 group-hover:text-azure transition-colors">
                      {club.tag}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-ice font-bold group-hover:text-azure transition-colors line-clamp-1">{club.name}</h4>
                      <p className="text-[10px] text-ice/30 font-black uppercase tracking-widest">{club.modality?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-4 border-t border-azure/5">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-ice/20 uppercase font-bold tracking-widest">Fundador</span>
                       <span className="text-[10px] text-ice/60 font-bold">@{club.president?.nickname || 'Desconhecido'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-ice/20 uppercase font-bold tracking-widest">Sede</span>
                       <span className="text-[10px] text-ice/60 font-bold">{club.location || 'N/A'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Link
                  href={getPageUrl(page - 1)}
                  className={`px-4 py-2 rounded-lg border border-azure/10 text-sm transition-all ${
                    page <= 1 ? 'pointer-events-none opacity-20' : 'hover:bg-azure/10 text-ice/60 hover:text-ice'
                  }`}
                >
                  ←
                </Link>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={getPageUrl(p)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                        p === page
                          ? 'bg-azure border-azure text-midnight'
                          : 'border-azure/10 text-ice/40 hover:border-azure/30 hover:text-ice'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
                <Link
                  href={getPageUrl(page + 1)}
                  className={`px-4 py-2 rounded-lg border border-azure/10 text-sm transition-all ${
                    page >= totalPages ? 'pointer-events-none opacity-20' : 'hover:bg-azure/10 text-ice/60 hover:text-ice'
                  }`}
                >
                  →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
