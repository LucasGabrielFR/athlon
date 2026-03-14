'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface PlayerFiltersProps {
  modalities: { id: number; name: string }[];
  positions: { id: number; name: string }[];
  initialFilters: {
    modality?: number;
    position?: number;
    status?: string;
  };
}

export function PlayerFilters({ modalities, positions, initialFilters }: PlayerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all') {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    // Reset page when filter changes
    params.delete('page');

    // Special logic for modality: if it changes, clear secondary filters like position
    if (name === 'modality') {
      params.delete('position');
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-slate rounded-xl border border-azure/10 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Modalidade</label>
          <select
            name="modality"
            value={initialFilters.modality || ''}
            onChange={(e) => handleFilterChange('modality', e.target.value)}
            className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors appearance-none cursor-pointer"
          >
            <option value="">Todas</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Posição</label>
          <select
            name="position"
            value={initialFilters.position || ''}
            onChange={(e) => handleFilterChange('position', e.target.value)}
            disabled={!initialFilters.modality}
            className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors disabled:opacity-50 appearance-none cursor-pointer"
          >
            <option value="">Todas</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Status</label>
          <select
            name="status"
            value={initialFilters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="free">Sem Clube (Free Agent)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
