import { auth } from '@/auth';
import { fetchApi } from '@/lib/api';
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
  const searchFilter = params.q as string | undefined;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const pageSize = 12;

  let allModalities: any[] = [];
  let availablePositions: any[] = [];
  let players: any[] = [];
  let totalPages = 1;

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString()
    });
    if (modalityFilter) queryParams.append('modality', modalityFilter.toString());
    if (positionFilter) queryParams.append('position', positionFilter.toString());
    if (statusFilter) queryParams.append('status', statusFilter);
    if (searchFilter) queryParams.append('q', searchFilter);

    const [modalitiesRes, positionsRes, playersRes] = await Promise.all([
      fetchApi('/modalities'),
      modalityFilter ? fetchApi(`/positions?modalityId=${modalityFilter}`) : Promise.resolve([]),
      fetchApi(`/players?${queryParams.toString()}`)
    ]);

    allModalities = Array.isArray(modalitiesRes) ? modalitiesRes : [];
    availablePositions = Array.isArray(positionsRes) ? positionsRes : [];
    
    if (playersRes) {
      players = playersRes.data || [];
      const totalItems = playersRes.total || 0;
      totalPages = Math.ceil(totalItems / pageSize);
    }
  } catch (e) {}

  const getPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (modalityFilter) sp.set('modality', modalityFilter.toString());
    if (positionFilter) sp.set('position', positionFilter.toString());
    if (statusFilter) sp.set('status', statusFilter);
    if (searchFilter) sp.set('q', searchFilter);
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
          search: searchFilter,
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
                        ) : m.isFreeAgent ? (
                          <div className="flex flex-col items-center mt-1">
                            <span className="text-[8px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 uppercase font-bold animate-pulse">
                              Buscando Clube
                            </span>
                            {m.freeAgentMessage && (
                              <p className="text-[8px] text-emerald-400/60 mt-1 max-w-[120px] truncate italic w-full text-center">"{m.freeAgentMessage}"</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[8px] text-ice/40 uppercase mt-1 font-bold">Sem Clube</span>
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
