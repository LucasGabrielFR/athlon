'use client';

import { useState, useEffect } from 'react';
import { Reorder, motion } from 'framer-motion';
import { GripVertical, Hash, Trophy, Goal, ArrowLeftRight } from 'lucide-react';

interface TieBreakerOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_OPTIONS: Record<string, TieBreakerOption> = {
  pts: { id: 'pts', label: 'Pontos', icon: <Hash size={14} /> },
  wins: { id: 'wins', label: 'Vitórias', icon: <Trophy size={14} /> },
  goalDiff: { id: 'goalDiff', label: 'Saldo de Gols', icon: <ArrowLeftRight size={14} /> },
  goalsFor: { id: 'goalsFor', label: 'Gols Pró', icon: <Goal size={14} /> },
};

export function TieBreakerSorter({ 
  initialOrder, 
  onChange 
}: { 
  initialOrder: string[], 
  onChange: (newOrder: string[]) => void 
}) {
  const [items, setItems] = useState<string[]>(() => {
    // Filter out options that might not exist in ALL_OPTIONS and ensure all ALL_OPTIONS keys are present
    const validInitial = initialOrder.filter(id => !!ALL_OPTIONS[id]);
    const missing = Object.keys(ALL_OPTIONS).filter(id => !validInitial.includes(id));
    return [...validInitial, ...missing];
  });

  const handleReorder = (newItems: string[]) => {
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] text-ice/40 uppercase tracking-[0.2em] font-black">
          Ordem de Prioridade (Arraste para organizar)
        </label>
      </div>

      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={handleReorder}
        className="space-y-2"
      >
        {items.map((id, index) => {
          const option = ALL_OPTIONS[id];
          if (!option) return null;

          return (
            <Reorder.Item
              key={id}
              value={id}
              className="relative"
            >
              <div className="group flex items-center gap-4 bg-slate-dark/50 border border-azure/10 hover:border-azure/30 p-4 rounded-2xl transition-all cursor-grab active:cursor-grabbing shadow-lg hover:shadow-azure/5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-azure/10 text-azure font-black text-xs italic">
                  {index + 1}º
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate/50 text-ice/60 border border-ice/5 group-hover:text-azure group-hover:border-azure/20 transition-colors">
                    {option.icon}
                  </div>
                  <span className="text-xs font-bold text-ice uppercase tracking-widest">{option.label}</span>
                </div>

                <div className="text-ice/20 group-hover:text-azure/40 transition-colors">
                  <GripVertical size={18} />
                </div>
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}
