import { auth } from '@/auth';
import { db } from '@/db';
import { users, playerProfiles, playerModalities, modalities, positions, clubMembers, clubs } from '@/db/schema';
import { eq, and, or, sql, isNull, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PlayerFilters } from './PlayerFilters';

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const params = await searchParams;
  const modalityFilter = params.modality ? Number(params.modality) : undefined;
  const positionFilter = params.position ? Number(params.position) : undefined;
  const statusFilter = params.status as string | undefined;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  // Fetch all modalities for the filter
  const allModalities = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
    orderBy: (m, { asc }) => [asc(m.name)],
  });

  // Fetch positions for the selected modality
  const availablePositions = modalityFilter 
    ? await db.query.positions.findMany({
        where: eq(positions.modalityId, modalityFilter),
      })
    : [];

  // Apply filters
  const conditions = [eq(users.role, 'player')];
  if (modalityFilter) {
    conditions.push(eq(playerModalities.modalityId, modalityFilter));
  }
  if (positionFilter) {
    conditions.push(or(
      eq(playerModalities.primaryPositionId, positionFilter),
      eq(playerModalities.secondaryPositionId, positionFilter)
    ) as any);
  }
  if (statusFilter === 'free') {
    conditions.push(isNull(clubMembers.id));
  }

  // 1. Get total count of distinct players matching filters
  const countQuery = db
    .select({ count: sql<number>`count(distinct ${users.id})` })
    .from(users)
    .leftJoin(playerModalities, eq(users.id, playerModalities.userId))
    .leftJoin(clubMembers, and(
      eq(users.id, clubMembers.userId),
      eq(playerModalities.modalityId, clubMembers.modalityId)
    ))
    .where(and(...conditions));
  
  const totalItemsResult = await countQuery;
  const totalItems = Number(totalItemsResult[0].count);
  const totalPages = Math.ceil(totalItems / pageSize);

  // 2. Get paginated user IDs
  const paginatedIdsQuery = db
    .select({ id: users.id })
    .from(users)
    .leftJoin(playerModalities, eq(users.id, playerModalities.userId))
    .leftJoin(clubMembers, and(
      eq(users.id, clubMembers.userId),
      eq(playerModalities.modalityId, clubMembers.modalityId)
    ))
    .where(and(...conditions))
    .groupBy(users.id)
    .orderBy(users.name)
    .limit(pageSize)
    .offset(offset);

  const paginatedIds = await paginatedIdsQuery;
  const userIds = paginatedIds.map(u => u.id);

  let players: any[] = [];
  
  if (userIds.length > 0) {
    // 3. Fetch full details for these specific user IDs
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        nickname: users.nickname,
        avatarUrl: playerProfiles.avatarUrl,
        modalityId: playerModalities.modalityId,
        modalityName: modalities.name,
        clubName: clubs.name,
        clubId: clubs.id,
        isInClub: sql<boolean>`${clubMembers.id} IS NOT NULL`,
      })
      .from(users)
      .leftJoin(playerProfiles, eq(users.id, playerProfiles.userId))
      .leftJoin(playerModalities, eq(users.id, playerModalities.userId))
      .leftJoin(modalities, eq(playerModalities.modalityId, modalities.id))
      .leftJoin(clubMembers, and(
        eq(users.id, clubMembers.userId),
        eq(playerModalities.modalityId, clubMembers.modalityId)
      ))
      .leftJoin(clubs, eq(clubMembers.clubId, clubs.id))
      .where(inArray(users.id, userIds))
      .orderBy(users.name);

    const playersMap = new Map();
    for (const r of results) {
      if (!playersMap.has(r.id)) {
        playersMap.set(r.id, {
          id: r.id,
          name: r.name,
          nickname: r.nickname,
          avatarUrl: r.avatarUrl,
          modalities: [],
        });
      }
      const p = playersMap.get(r.id);
      if (r.modalityId) {
        p.modalities.push({
          id: r.modalityId,
          name: r.modalityName,
          isInClub: r.isInClub,
          clubId: r.clubId,
          clubName: r.clubName,
        });
      }
    }
    players = Array.from(playersMap.values());
  }

  const getPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (modalityFilter) sp.set('modality', modalityFilter.toString());
    if (positionFilter) sp.set('position', positionFilter.toString());
    if (statusFilter) sp.set('status', statusFilter);
    sp.set('page', p.toString());
    return `?${sp.toString()}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-ice tracking-tight">Mercado de Jogadores</h2>
          <p className="text-ice/40 mt-1">Encontre novos talentos para o seu clube ou explore a comunidade.</p>
        </div>
      </div>

      {/* Filters */}
      <PlayerFilters
        modalities={allModalities.map(m => ({ id: m.id, name: m.name }))}
        positions={availablePositions.map(p => ({ id: p.id, name: p.name }))}
        initialFilters={{
          modality: modalityFilter,
          position: positionFilter,
          status: statusFilter,
        }}
      />

      {/* Grid */}
      {players.length === 0 ? (
        <div className="bg-slate/50 rounded-2xl border border-dashed border-azure/10 py-20 text-center">
          <p className="text-4xl mb-4">🕵️‍♂️</p>
          <p className="text-ice font-medium">Nenhum jogador encontrado com esses filtros.</p>
          <Link href="/dashboard/players" className="text-azure text-sm hover:underline mt-2 inline-block">Limpar filtros</Link>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/players/${p.id}`}
                className="group bg-slate rounded-xl border border-azure/10 hover:border-azure/30 hover:bg-azure/5 transition-all p-5 flex flex-col items-center text-center cursor-pointer"
              >
                <div className="relative mb-4">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-20 h-20 rounded-full object-cover border-2 border-azure/20 group-hover:border-azure/40 transition-colors" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-midnight border-2 border-azure/10 flex items-center justify-center text-2xl font-black text-azure/40 uppercase group-hover:border-azure/40 transition-colors">
                      {p.name[0]}
                    </div>
                  )}
                </div>
                
                <h3 className="text-ice font-bold group-hover:text-azure transition-colors">{p.name}</h3>
                <p className="text-azure/60 font-mono text-[10px] uppercase tracking-wider mb-4">@{p.nickname || 'vaga'}</p>
  
                <div className="w-full flex flex-wrap justify-center gap-2">
                  {p.modalities.length > 0 ? (
                    p.modalities.map((m: any) => (
                      <div key={m.id} className="flex flex-col items-center">
                        <span className="text-[10px] bg-midnight border border-azure/10 px-2 py-1 rounded text-ice/70 whitespace-nowrap">
                          {m.name}
                        </span>
                        {m.isInClub ? (
                          <div className="flex flex-col items-center mt-1">
                            <span className="text-[7px] text-amber-500/40 uppercase font-black tracking-tighter">Clube</span>
                            <span className="text-[9px] text-amber-500 font-bold max-w-[120px] truncate">
                              {m.clubName || 'Desconhecido'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-emerald-400 uppercase mt-1 font-bold">Free Agent</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] bg-midnight border border-azure/10 px-2 py-1 rounded text-azure/40 whitespace-nowrap">
                      Nenhuma Modalidade
                    </span>
                  )}
                </div>
  
                <div className="mt-6 pt-4 border-t border-azure/5 w-full">
                  <span className="text-xs text-azure font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Perfil Completo →
                  </span>
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
                ← Anterior
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
                Próximo →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
