import { auth } from '@/auth';
import { db } from '@/db';
import { users, playerProfiles, playerModalities, modalities, positions, clubMembers } from '@/db/schema';
import { eq, and, or, sql, isNull, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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
  const statusFilter = params.status as string | undefined; // 'free' or undefined (all)

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

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatarUrl: playerProfiles.avatarUrl,
      modalityId: playerModalities.modalityId,
      modalityName: modalities.name,
      primaryPos: {
        id: playerModalities.primaryPositionId,
      },
      secondaryPos: {
        id: playerModalities.secondaryPositionId,
      },
      isInClub: sql<boolean>`${clubMembers.id} IS NOT NULL`,
    })
    .from(users)
    .innerJoin(playerProfiles, eq(users.id, playerProfiles.userId))
    .innerJoin(playerModalities, eq(users.id, playerModalities.userId))
    .innerJoin(modalities, eq(playerModalities.modalityId, modalities.id))
    .leftJoin(clubMembers, and(
      eq(users.id, clubMembers.userId),
      eq(playerModalities.modalityId, clubMembers.modalityId)
    ))
    .where(and(...conditions))
    .orderBy(users.name);

  // Group by user so we don't show the same player twice if they have multiple modalities matching (though filters usually restrict to one)
  // But if no filters are applied, a player with 2 modalities appears twice.
  // Actually, for a marketplace, seeing them per modality might be fine, but grouping is better.
  
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
    p.modalities.push({
      id: r.modalityId,
      name: r.modalityName,
      isInClub: r.isInClub,
    });
  }

  const players = Array.from(playersMap.values());

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-ice tracking-tight">Mercado de Jogadores</h2>
          <p className="text-ice/40 mt-1">Encontre novos talentos para o seu clube ou explore a comunidade.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate rounded-xl border border-azure/10 p-5">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Modalidade</label>
            <select
              name="modality"
              defaultValue={modalityFilter}
              className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors"
            >
              <option value="">Todas</option>
              {allModalities.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Posição</label>
            <select
              name="position"
              defaultValue={positionFilter}
              disabled={!modalityFilter}
              className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors disabled:opacity-50"
            >
              <option value="">Todas</option>
              {availablePositions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Status</label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors"
            >
              <option value="all">Todos</option>
              <option value="free">Sem Clube (Free Agent)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-azure text-midnight font-bold py-2 rounded-lg hover:bg-azure/80 transition-all text-sm"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Grid */}
      {players.length === 0 ? (
        <div className="bg-slate/50 rounded-2xl border border-dashed border-azure/10 py-20 text-center">
          <p className="text-4xl mb-4">🕵️‍♂️</p>
          <p className="text-ice font-medium">Nenhum jogador encontrado com esses filtros.</p>
          <Link href="/dashboard/players" className="text-azure text-sm hover:underline mt-2 inline-block">Limpar filtros</Link>
        </div>
      ) : (
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
                {p.modalities.map((m: any) => (
                  <div key={m.id} className="flex flex-col items-center">
                    <span className="text-[10px] bg-midnight border border-azure/10 px-2 py-1 rounded text-ice/70 whitespace-nowrap">
                      {m.name}
                    </span>
                    {m.isInClub ? (
                      <span className="text-[8px] text-amber-500/60 uppercase mt-0.5 font-bold">Em Clube</span>
                    ) : (
                      <span className="text-[8px] text-emerald-400 uppercase mt-0.5 font-bold">Free Agent</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-azure/5 w-full">
                <span className="text-xs text-azure font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver Perfil Completo →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
