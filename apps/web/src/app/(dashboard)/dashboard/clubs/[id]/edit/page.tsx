import { auth } from '@/auth';
import { fetchApi } from '@/lib/api';
import { notFound, redirect } from 'next/navigation';
import { updateClubAction } from '@/app/actions/clubs';
import { ImageUpload } from '@/components/ui/ImageUpload';
import Link from 'next/link';

export default async function EditClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);
  const search = await searchParams;

  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as { id?: string | number }).id);

  let clubData: any = null;
  
  try {
    clubData = await fetchApi(`/clubs/${clubId}/details`);
  } catch (e) {
    // silently fail
  }

  if (!clubData || !clubData.club) notFound();

  const { club } = clubData;

  // Only the president can edit the club
  if (club.presidentId !== userId) {
    redirect(`/dashboard/clubs/${clubId}`);
  }

  const errorMessages: Record<string, string> = {
    update_failed: 'Erro ao atualizar o clube. Tente novamente.',
  };
  const error = search?.error ? errorMessages[search.error] : null;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/clubs/${clubId}`}
          className="text-ice/40 hover:text-ice text-sm flex items-center gap-1 mb-4 transition-colors"
        >
          ← Voltar para o Clube
        </Link>
        <h2 className="text-3xl font-bold text-ice">Editar Clube</h2>
        <p className="text-ice/40 mt-1">
          Atualize as informações do seu clube.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-rose-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form action={updateClubAction} className="space-y-6">
        <input type="hidden" name="clubId" value={clubId} />

        {/* Club Name (Immutable) */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Nome do Clube <span className="text-ice/30 font-normal">(Imutável)</span>
          </label>
          <input
            name="name"
            value={club.name}
            disabled
            className="w-full bg-slate-dark border border-azure/10 text-ice/40 rounded-lg px-4 py-3 cursor-not-allowed"
          />
        </div>

        {/* Tag (Immutable) */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Tag / Sigla <span className="text-ice/30 font-normal">(Imutável)</span>
          </label>
          <input
            name="tag"
            value={club.tag}
            disabled
            className="w-full bg-slate-dark border border-azure/10 text-ice/40 rounded-lg px-4 py-3 cursor-not-allowed"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Localização <span className="text-ice/30 font-normal">(opcional)</span>
          </label>
          <input
            name="location"
            defaultValue={club.location || ''}
            placeholder="ex: Porto Alegre, RS"
            className="w-full bg-slate border border-azure/20 text-ice rounded-lg px-4 py-3 placeholder-ice/20 focus:outline-none focus:border-azure/60 transition-colors"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Escudo do Clube
          </label>
          <ImageUpload 
            name="logoUrl" 
            label="Atualizar escudo" 
            className="w-32 h-32 mx-auto rounded-full" 
            endpoint="club"
            currentImageUrl={club.logoUrl}
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-azure text-midnight font-bold py-3 rounded-lg hover:bg-azure/80 transition-colors"
          >
            💾 Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
