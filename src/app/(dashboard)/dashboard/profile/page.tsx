import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { playerProfiles, playerModalities, modalities, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateProfileAction, addPlayerModalityAction, removePlayerModalityAction, setActiveModalityAction } from '@/app/actions/profile';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = Number(session.user.id);

  // Load user data
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const profile = await db.query.playerProfiles.findFirst({ where: eq(playerProfiles.userId, userId) });

  // Player's linked modalities
  const linked = await db
    .select({ modality: modalities })
    .from(playerModalities)
    .innerJoin(modalities, eq(playerModalities.modalityId, modalities.id))
    .where(eq(playerModalities.userId, userId));

  // All modalities for the "add" selector
  const linkedIds = linked.map((l) => l.modality.id);
  const allModalities = await db.select().from(modalities).orderBy(modalities.name);
  const available = allModalities.filter((m) => !linkedIds.includes(m.id));

  const activeModalityId = profile?.activeModalityId;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-ice">Meu Perfil</h2>
        <p className="text-ice/40 mt-1">Gerencie suas informações e modalidades praticadas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Avatar & Identity */}
        <div className="space-y-6">
          {/* Avatar card */}
          <div className="bg-slate rounded-xl border border-azure/10 p-6 flex flex-col items-center text-center">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-azure/40 mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-azure/10 border-2 border-azure/20 flex items-center justify-center text-4xl mb-4">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <p className="text-ice font-bold text-lg">{user?.name}</p>
            <p className="text-azure/60 text-sm">@{user?.nickname ?? 'sem nickname'}</p>
            <span className="mt-2 text-xs bg-azure/10 text-azure border border-azure/20 px-3 py-1 rounded-full capitalize">
              {(session.user as { role?: string })?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate rounded-xl border border-azure/10 p-6">
            <h3 className="text-ice font-bold text-lg mb-5">Dados Pessoais</h3>
            <form action={updateProfileAction} className="space-y-4">
              <div>
                <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user?.name ?? ''}
                  className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">Bio</label>
                <textarea
                  name="bio"
                  rows={3}
                  defaultValue={profile?.bio ?? ''}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-ice/60 mb-1 uppercase tracking-wider">URL do Avatar</label>
                <input
                  type="url"
                  name="avatarUrl"
                  defaultValue={profile?.avatarUrl ?? ''}
                  placeholder="https://..."
                  className="w-full bg-navy border border-azure/20 rounded-lg px-4 py-3 text-ice placeholder:text-ice/30 focus:outline-none focus:border-azure transition-colors"
                />
              </div>
              <button
                type="submit"
                className="bg-azure text-navy font-bold px-6 py-2.5 rounded-lg hover:bg-ice transition-colors"
              >
                Salvar Alterações
              </button>
            </form>
          </div>

          {/* Modalities */}
          <div className="bg-slate rounded-xl border border-azure/10 p-6">
            <h3 className="text-ice font-bold text-lg mb-5">Minhas Modalidades</h3>

            {linked.length === 0 ? (
              <p className="text-ice/30 text-sm mb-4">Você ainda não adicionou nenhuma modalidade.</p>
            ) : (
              <div className="space-y-2 mb-6">
                {linked.map(({ modality: m }) => (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    activeModalityId === m.id
                      ? 'border-azure bg-azure/10'
                      : 'border-azure/10 hover:border-azure/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.isTeamBased ? '👥' : '🧍'}</span>
                      <div>
                        <p className="text-ice font-medium text-sm">{m.name}</p>
                        {activeModalityId === m.id && (
                          <p className="text-xs text-azure">● Modalidade ativa</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeModalityId !== m.id && (
                        <form action={setActiveModalityAction}>
                          <input type="hidden" name="modalityId" value={m.id} />
                          <button type="submit" className="text-xs text-azure/60 hover:text-azure transition-colors px-2 py-1 rounded hover:bg-azure/10">
                            Ativar
                          </button>
                        </form>
                      )}
                      <form action={removePlayerModalityAction}>
                        <input type="hidden" name="modalityId" value={m.id} />
                        <button type="submit" className="text-xs text-red-400/50 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10">
                          Remover
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {available.length > 0 && (
              <form action={addPlayerModalityAction} className="flex gap-3">
                <select
                  name="modalityId"
                  className="flex-1 bg-navy border border-azure/20 rounded-lg px-4 py-2.5 text-ice focus:outline-none focus:border-azure transition-colors text-sm"
                >
                  <option value="">Selecione uma modalidade...</option>
                  {available.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.isTeamBased ? '👥' : '🧍'} {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-azure/10 text-azure border border-azure/30 font-bold px-4 py-2.5 rounded-lg hover:bg-azure hover:text-navy transition-colors text-sm whitespace-nowrap"
                >
                  + Adicionar
                </button>
              </form>
            )}

            {available.length === 0 && linked.length > 0 && (
              <p className="text-ice/20 text-xs">Você já pratica todas as modalidades disponíveis.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
