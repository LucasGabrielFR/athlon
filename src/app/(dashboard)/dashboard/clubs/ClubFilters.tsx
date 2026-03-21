'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface ClubFiltersProps {
  modalities: { id: number; name: string }[];
  initialFilters: {
    modality?: number;
    search?: string;
  };
}

export function ClubFilters({ modalities, initialFilters }: ClubFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const updateSearchParam = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    if (debouncedSearch !== (searchParams.get('q') || '')) {
      updateSearchParam('q', debouncedSearch);
    }
  }, [debouncedSearch, searchParams, updateSearchParam]);

  return (
    <div className="bg-slate rounded-xl border border-azure/10 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Buscar Clube</label>
          <input
            type="text"
            placeholder="Nome ou Tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-azure/50 uppercase tracking-widest mb-2">Modalidade</label>
          <select
            name="modality"
            value={initialFilters.modality || ''}
            onChange={(e) => updateSearchParam('modality', e.target.value)}
            className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-azure transition-colors appearance-none cursor-pointer"
          >
            <option value="">Todas</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
