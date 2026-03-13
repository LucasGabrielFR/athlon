import { auth } from '@/auth';
import { db } from '@/db';
import { users, playerProfiles, playerModalities, clubMembers, clubs, modalities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { invitePlayerAction } from '@/app/actions/clubs';

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const targetId = Number(id);

  const session = await auth();
  if (!session?.user) redirect('/login');
  const sessionUserId = Number((session.user as { id?: string | number }).id);

  // Fetch player data
  const player = await db.query.users.findFirst({
    where: eq(users.id, targetId),
    with: {
      memberships: {
        with: {
          club: true,
          modality: true,
        }
      }
    }
  });

  if (!player || player.role !== 'player') notFound();

  const profile = await db.query.playerProfiles.findFirst({
    where: eq(playerProfiles.userId, targetId),
  });

  const playerMods = await db.query.playerModalities.findMany({
    where: eq(playerModalities.userId, targetId),
    with: {
      modality: true,
      primaryPosition: true,
      secondaryPosition: true,
    }
  });

  // Fetch session user's clubs (to show the invite option if they are a president)
  const myClubs = await db.query.clubs.findMany({
    where: eq(clubs.presidentId, sessionUserId),
  });

  const isPresident = myClubs.length > 0;
  const isOwnProfile = sessionUserId === targetId;

  // Active modalities for the platform (to filter available ones)
  const allModalities = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/players"
        className="text-ice/40 hover:text-ice text-sm flex items-center gap-1 transition-colors w-fit"
      >
        ← Voltar ao Mercado
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate border border-azure/10">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-midnight to-azure/20" />
        
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-12">
          <div className="relative shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={player.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-slate bg-slate shadow-xl" />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-midnight border-4 border-slate flex items-center justify-center text-4xl font-black text-azure/40 shadow-xl">
                {player.name[0]}
              </div>
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-black text-ice tracking-tight">{player.name}</h1>
            <p className="text-azure font-mono text-sm">@{player.nickname || 'sem-nick'}</p>
          </div>

          {!isOwnProfile && isPresident && (
            <div className="pb-2">
               <a 
                href="#invite-form-container"
                className="bg-azure hover:bg-azure/80 text-midnight font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-azure/10 block w-fit"
              >
                🤝 Convidar para Clube
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate rounded-xl border border-azure/10 p-6">
            <h3 className="text-xs font-bold text-azure/50 uppercase tracking-widest mb-4">Sobre</h3>
            <p className="text-ice/70 text-sm leading-relaxed">
              {profile?.bio || 'Este jogador ainda não preencheu sua bio.'}
            </p>
            <div className="mt-6 pt-6 border-t border-azure/5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-ice/40">Localização</span>
                <span className="text-ice">{player.location || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ice/40">Membro desde</span>
                <span className="text-ice">
                  {player.createdAt ? new Date(player.createdAt).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate rounded-xl border border-azure/10 p-6">
            <h3 className="text-xs font-bold text-azure/50 uppercase tracking-widest mb-4">Clubes Atuais</h3>
            {player.memberships?.length === 0 ? (
              <p className="text-ice/30 text-xs italic">Sem clube no momento. Disponível no mercado.</p>
            ) : (
              <div className="space-y-3">
                {player.memberships?.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-midnight/40 p-3 rounded-lg border border-azure/5">
                    {m.club.logoUrl ? (
                      <img src={m.club.logoUrl} alt={m.club.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-azure/10 flex items-center justify-center text-[10px] font-bold text-azure">{m.club.tag}</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-ice text-xs font-bold truncate">{m.club.name}</p>
                      <p className="text-azure/60 text-[10px] uppercase font-bold">{m.modality.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Modalidades / Skills */}
          <div className="bg-slate rounded-xl border border-azure/10 p-6">
            <h3 className="text-ice font-bold text-lg mb-6 flex items-center gap-2">
              <span className="p-1.5 bg-azure/10 rounded text-azure">🎮</span>
              Modalidades e Especialidades
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {playerMods.map((pm) => (
                <div key={pm.id} className="bg-midnight/40 border border-azure/10 rounded-xl p-4 hover:border-azure/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-lg font-bold text-ice">{pm.modality.name}</span>
                    <span className="text-[10px] bg-azure/10 text-azure px-2 py-0.5 rounded border border-azure/20 uppercase font-black tracking-tighter">
                      {pm.modality.isTeamBased ? 'Equipe' : 'Individual'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-azure" />
                      <p className="text-xs text-ice/60">
                        Principal: <span className="text-ice font-semibold">{pm.primaryPosition?.name || 'Não informada'}</span>
                      </p>
                    </div>
                    {pm.secondaryPosition && (
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-azure/30" />
                        <p className="text-xs text-ice/60">
                          Secundária: <span className="text-ice/80 font-medium">{pm.secondaryPosition.name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {playerMods.length === 0 && (
              <p className="text-ice/30 text-sm text-center py-4 italic">Nenhuma modalidade cadastrada.</p>
            )}
          </div>

          {/* Invite Form (if president) */}
          {!isOwnProfile && isPresident && (
            <div id="invite-form-container" className="bg-slate rounded-xl border border-emerald-500/20 p-6 shadow-2xl shadow-emerald-500/5">
              <h3 className="text-emerald-400 font-bold text-lg mb-1 flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 rounded">📨</span>
                Enviar Convite
              </h3>
              <p className="text-ice/40 text-xs mb-6 uppercase tracking-widest font-medium">Contratar {player.name} para o seu elenco</p>

              <form action={invitePlayerAction} className="space-y-5">
                <input type="hidden" name="targetUserId" value={targetId} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-ice/40 uppercase tracking-widest mb-2">Seu Clube</label>
                    <select
                      name="clubId"
                      required
                      className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Selecione o clube...</option>
                      {myClubs.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} [{c.tag}]</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-ice/40 uppercase tracking-widest mb-2">Modalidade</label>
                    <select
                      name="modalityId"
                      required
                      className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Selecione a modalidade...</option>
                      {/* Show only modalities the player is in */}
                      {playerMods.map((pm) => (
                        <option key={pm.modalityId} value={pm.modalityId}>{pm.modality.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-ice/40 uppercase tracking-widest mb-2">Mensagem do Convite <span className="normal-case opacity-40">(opcional)</span></label>
                  <textarea
                    name="message"
                    rows={2}
                    placeholder="Olá! Gostaríamos de contar com seu talento no nosso elenco de..."
                    className="w-full bg-midnight border border-azure/20 text-ice rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-midnight font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-emerald-500/10"
                  >
                    Enviar Proposta Oficial
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
