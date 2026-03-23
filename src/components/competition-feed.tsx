'use client';

import { createCompetitionPostAction, togglePinPostAction, addPostCommentAction, deletePostCommentAction, togglePostReactionAction } from '@/app/actions/competitions';
import { useState } from 'react';
import { Pin, Send, Megaphone, Info, Heart, MessageCircle, Trash2 } from 'lucide-react';

interface Post {
  id: number;
  type: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | null;
  author?: {
    name: string | null;
  };
  comments?: {
    id: number;
    content: string;
    createdAt: Date | null;
    author: { id: number; name: string | null };
  }[];
  reactions?: {
    id: number;
    userId: number;
    type: string;
  }[];
}

export function CompetitionFeed({ 
  competitionId, 
  posts, 
  isOrganizer,
  currentUserId
}: { 
  competitionId: number; 
  posts: Post[]; 
  isOrganizer: boolean;
  currentUserId: number | null; 
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

            {/* Reactions & Comments Toggle */}
            {post.type !== 'system' && currentUserId && (
              <div className="mt-4 pt-3 border-t border-azure/5 flex items-center gap-4">
                <form action={togglePostReactionAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="type" value="like" />
                  <button type="submit" className="flex items-center gap-1.5 text-xs font-semibold group transition-colors">
                    <Heart 
                      size={14} 
                      className={`transition-all ${post.reactions?.some(r => r.userId === currentUserId) ? 'fill-emerald-500 text-emerald-500' : 'text-ice/40 group-hover:text-emerald-400 group-hover:fill-emerald-400/20'}`} 
                    />
                    <span className={post.reactions?.some(r => r.userId === currentUserId) ? 'text-emerald-500' : 'text-ice/40 group-hover:text-emerald-400'}>
                      {post.reactions?.length || 0}
                    </span>
                  </button>
                </form>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-ice/40">
                  <MessageCircle size={14} />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            )}

            {/* Comments Section */}
            {post.type !== 'system' && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-azure/10">
                {post.comments?.map(comment => (
                  <div key={comment.id} className="group relative bg-navy/50 p-3 rounded-xl border border-azure/5">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-bold text-azure">{comment.author.name}</p>
                      
                      {(comment.author.id === currentUserId || isOrganizer) && (
                        <form action={deletePostCommentAction} className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
                          <input type="hidden" name="commentId" value={comment.id} />
                          <button type="submit" className="text-red-400/50 hover:text-red-400 p-1">
                            <Trash2 size={12} />
                          </button>
                        </form>
                      )}
                    </div>
                    <p className="text-xs text-ice/80">{comment.content}</p>
                    <p className="text-[8px] text-ice/30 mt-1 uppercase tracking-tighter">
                      {new Date(comment.createdAt!).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}

                {currentUserId && (
                  <form action={addPostCommentAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="postId" value={post.id} />
                    <input 
                      type="text" 
                      name="content" 
                      required
                      placeholder="Adicionar comentário..." 
                      className="flex-1 bg-navy border border-azure/10 rounded-lg px-3 py-2 text-xs text-ice placeholder:text-ice/20 focus:outline-none focus:border-azure/40 transition-colors"
                    />
                    <button type="submit" className="bg-azure/10 hover:bg-azure/20 text-azure p-2 rounded-lg transition-colors border border-azure/20">
                      <Send size={14} />
                    </button>
                  </form>
                )}
              </div>
            )}
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
