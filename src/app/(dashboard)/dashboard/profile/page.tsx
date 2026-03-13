import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { playerProfiles, users, modalities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateProfileAction } from '@/app/actions/profile';
import AddModalityForm from './AddModalityForm';
import LinkedModalityItem from './LinkedModalityItem';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = Number(session.user.id);

  // Load user data
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const profile = await db.query.playerProfiles.findFirst({ where: eq(playerProfiles.userId, userId) });

  // Player's linked modalities with positions
  const linked = await db.query.playerModalities.findMany({
    where: (pm, { eq }) => eq(pm.userId, userId),
    with: {
      modality: {
        with: {
          positions: true
        }
      },
      primaryPosition: true,
      secondaryPosition: true,
    }
  });

  // All modalities for the "add" selector
  const linkedIds = linked.map((l) => l.modalityId);
  const availableModalities = await db.query.modalities.findMany({
    where: (m, { and, eq, notInArray }) => and(
      eq(m.isActive, true),
      linkedIds.length > 0 ? notInArray(m.id, linkedIds) : undefined
    ),
    with: {
      positions: true
    },
    orderBy: (m, { asc }) => [asc(m.name)],
  });

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
              <div className="space-y-3 mb-6">
                {linked.map((item) => (
                  <LinkedModalityItem 
                    key={item.id} 
                    item={item as any} 
                    isActive={activeModalityId === item.modalityId} 
                  />
                ))}
              </div>
            )}

            {availableModalities.length > 0 && (
              <AddModalityForm modalities={availableModalities as any} />
            )}

            {availableModalities.length === 0 && linked.length > 0 && (
              <p className="text-ice/20 text-xs">Você já pratica todas as modalidades disponíveis.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
