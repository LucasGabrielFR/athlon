import { db } from '@/db';
import { modalities } from '@/db/schema';
import { createClubAction } from '@/app/actions/clubs';
import { auth } from '@/auth';
import { clubMembers } from '@/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NewClubPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as { id?: string | number }).id);

  // Get modalities the user is already in
  const myMemberships = await db.query.clubMembers.findMany({
    where: eq(clubMembers.userId, userId),
    columns: { modalityId: true },
  });
  const myModalityIds = myMemberships.map(m => m.modalityId);

  // Rules: 
  // 1. Only team-based modalities
  // 2. User cannot re-create a club in a modality they already play
  const activeModalities = await db.query.modalities.findMany({
    where: and(
      eq(modalities.isActive, true),
      eq(modalities.isTeamBased, true),
      myModalityIds.length > 0 ? notInArray(modalities.id, myModalityIds) : undefined
    ),
  });

  const errorMessages: Record<string, string> = {
    missing_fields: 'Preencha todos os campos obrigatórios.',
    tag_too_long: 'A tag do clube deve ter no máximo 5 caracteres.',
    creation_failed: 'Erro ao criar o clube. Tente novamente.',
    already_in_modality: 'Você já participa de um clube nesta modalidade.',
  };
  const error = params?.error ? errorMessages[params.error] : null;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/clubs"
          className="text-ice/40 hover:text-ice text-sm flex items-center gap-1 mb-4 transition-colors"
        >
          ← Voltar para Clubes
        </Link>
        <h2 className="text-3xl font-bold text-ice">Fundar um Clube</h2>
        <p className="text-ice/40 mt-1">
          Você se tornará o presidente fundador e terá pleno controle do elenco.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-rose-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form action={createClubAction} className="space-y-6">
        {/* Club Name */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Nome do Clube <span className="text-rose-400">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="ex: Dragões do Sul"
            className="w-full bg-slate border border-azure/20 text-ice rounded-lg px-4 py-3 placeholder-ice/20 focus:outline-none focus:border-azure/60 transition-colors"
          />
        </div>

        {/* Tag */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Tag / Sigla <span className="text-rose-400">*</span>{' '}
            <span className="text-ice/30 font-normal">(máx. 5 letras)</span>
          </label>
          <input
            name="tag"
            required
            maxLength={5}
            placeholder="ex: DGS"
            className="w-full bg-slate border border-azure/20 text-ice rounded-lg px-4 py-3 placeholder-ice/20 focus:outline-none focus:border-azure/60 transition-colors uppercase"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        {/* Modality */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Modalidade Principal <span className="text-rose-400">*</span>
          </label>
          {activeModalities.length === 0 ? (
            <p className="text-ice/30 text-sm">Nenhuma modalidade ativa cadastrada.</p>
          ) : (
            <select
              name="modalityId"
              required
              className="w-full bg-slate border border-azure/20 text-ice rounded-lg px-4 py-3 focus:outline-none focus:border-azure/60 transition-colors"
            >
              <option value="">Selecione uma modalidade...</option>
              {activeModalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            Localização <span className="text-ice/30 font-normal">(opcional)</span>
          </label>
          <input
            name="location"
            placeholder="ex: Porto Alegre, RS"
            className="w-full bg-slate border border-azure/20 text-ice rounded-lg px-4 py-3 placeholder-ice/20 focus:outline-none focus:border-azure/60 transition-colors"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-ice/60 text-sm font-medium mb-2">
            URL do Escudo <span className="text-ice/30 font-normal">(opcional)</span>
          </label>
          <input
            name="logoUrl"
            type="url"
            placeholder="https://..."
            className="w-full bg-slate border border-azure/20 text-ice rounded-lg px-4 py-3 placeholder-ice/20 focus:outline-none focus:border-azure/60 transition-colors"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-azure text-midnight font-bold py-3 rounded-lg hover:bg-azure/80 transition-colors"
          >
            🛡️ Fundar Clube
          </button>
        </div>
      </form>
    </div>
  );
}
