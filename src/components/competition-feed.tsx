'use client';

import { createCompetitionPostAction, togglePinPostAction } from '@/app/actions/competitions';
import { useState } from 'react';
import { Pin, Send, Megaphone, Info } from 'lucide-react';

interface Post {
  id: number;
  type: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | null;
  author?: {
    name: string | null;
  };
}

export function CompetitionFeed({ 
  competitionId, 
  posts, 
  isOrganizer 
}: { 
  competitionId: number; 
  posts: Post[]; 
  isOrganizer: boolean 
}) {
  const [content, setContent] = useState('');

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
  });

  return (
    <div className="space-y-6">
      {isOrganizer && (
        <form 
          action={async (formData) => {
            await createCompetitionPostAction(formData);
            setContent('');
          }}
          className="bg-slate border border-azure/20 p-4 rounded-2xl flex flex-col gap-3 group focus-within:border-azure transition-all"
        >
          <input type="hidden" name="competitionId" value={competitionId} />
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Publique um aviso ou atualização para os participantes..."
            className="bg-transparent text-ice text-sm placeholder:text-ice/20 outline-none resize-none min-h-[80px]"
          />
          <div className="flex justify-between items-center bg-slate-dark/30 -mx-4 -mb-4 p-3 rounded-b-2xl border-t border-azure/10">
            <span className="text-[10px] text-ice/40 italic">As postagens são visíveis para todos.</span>
            <button 
              type="submit"
              disabled={!content.trim()}
              className="bg-azure hover:bg-azure-dark text-slate p-2 rounded-xl transition-all disabled:opacity-20 group-hover:scale-105"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sortedPosts.map((post) => (
          <div 
            key={post.id} 
            className={`relative p-5 rounded-2xl border transition-all ${
              post.isPinned 
                ? 'bg-azure/5 border-azure/30 ring-1 ring-azure/20' 
                : 'bg-slate border-azure/5'
            }`}
          >
            {post.isPinned && (
              <div className="absolute -top-2 -left-2 bg-azure p-1.5 rounded-lg shadow-lg">
                <Pin size={12} className="text-slate fill-slate" />
              </div>
            )}

            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {post.type === 'system' ? (
                  <div className="h-6 w-6 bg-amber-500/10 rounded flex items-center justify-center">
                    <Info size={14} className="text-amber-400" />
                  </div>
                ) : (
                  <div className="h-6 w-6 bg-azure/10 rounded flex items-center justify-center text-[10px] font-black text-azure">
                    {post.author?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black text-ice uppercase tracking-widest">
                    {post.type === 'system' ? 'Sistema Athlon' : post.author?.name || 'Administrador'}
                  </p>
                  <p className="text-[8px] text-ice/30 uppercase font-bold tracking-tighter">
                    {new Date(post.createdAt!).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {isOrganizer && post.type !== 'system' && (
                <form action={togglePinPostAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button 
                    type="submit"
                    className={`p-1.5 rounded-lg border transition-all ${
                      post.isPinned 
                        ? 'bg-azure text-slate border-azure' 
                        : 'bg-slate-dark text-ice/30 border-ice/10 hover:border-azure/40 hover:text-azure'
                    }`}
                  >
                    <Pin size={12} />
                  </button>
                </form>
              )}
            </div>

            <div className={`text-sm leading-relaxed ${post.type === 'system' ? 'text-ice/60 italic font-medium' : 'text-ice'}`}>
              {post.content}
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20 bg-slate/30 border border-dashed border-ice/5 rounded-3xl">
            <Megaphone size={40} className="mx-auto text-ice/10 mb-4" />
            <p className="text-sm text-ice/30 font-bold uppercase tracking-widest">Nenhuma atividade registrada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
