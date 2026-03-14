import { auth } from '@/auth';
import { db } from '@/db';
import { modalities, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createCompetitionAction } from '@/app/actions/competitions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NewCompetitionPage({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  const { organizationId } = await searchParams;
  const session = await auth();
  
  if (!session?.user) redirect('/login');
  
  const userId = Number((session.user as { id?: string | number }).id);
  const userRole = (session.user as { role?: string }).role;

  // Only Org Presidents or Admins can access this page
  if (userRole !== 'admin' && userRole !== 'org_president') {
    redirect('/dashboard?error=unauthorized');
  }

  const allModalities = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
  });

  const myOrganizations = await db.query.organizations.findMany({
    where: eq(organizations.presidentId, userId),
  });

  if (myOrganizations.length === 0) {
    redirect('/dashboard/organizations/new?error=need_organization');
  }

  return (
    <div className="max-w-4xl mx-auto py-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-ice tracking-tight">Novo <span className="text-azure">Torneio</span></h2>
          <p className="text-ice/40 text-sm mt-1">Configure as regras e o formato da sua competição.</p>
        </div>
        <Link 
          href={organizationId ? `/dashboard/organizations/${organizationId}` : "/dashboard/competitions"}
          className="text-ice/20 hover:text-ice text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Cancelar
        </Link>
      </div>

      <form action={createCompetitionAction} className="space-y-8">
        {/* Step 1: Identity */}
        <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">1</span>
            <h3 className="text-lg font-bold text-ice">Identidade & Local</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Nome da Competição</label>
              <input 
                name="name"
                type="text"
                required
                placeholder="Ex: Copa Master de Inverno"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Modalidade</label>
              <select 
                name="modalityId"
                required
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none"
              >
                <option value="">Selecione...</option>
                {allModalities.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Organização Responsável</label>
              <select 
                name="organizationId"
                required
                defaultValue={organizationId || ""}
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
              >
                <option value="" disabled>Selecione a Organização...</option>
                {myOrganizations.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Formato</label>
              <select 
                name="format"
                required
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all appearance-none font-bold"
              >
                <option value="round_robin">Pontos Corridos (Round Robin)</option>
                <option value="knockout">Mata-mata (Single Elimination)</option>
                <option value="groups_knockout">Grupos + Mata-mata</option>
              </select>
            </div>
          </div>
        </section>

        {/* Step 2: Settings & Financials */}
        <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">2</span>
            <h3 className="text-lg font-bold text-ice">Configurações & Premiação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Máx. de Equipes</label>
              <input 
                name="maxTeams"
                type="number"
                placeholder="Ex: 16"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Taxa de Inscrição ($)</label>
              <input 
                name="entryFee"
                type="number"
                defaultValue={0}
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Premiação Total ($)</label>
              <input 
                name="prizePool"
                type="number"
                defaultValue={0}
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Step 3: Roster Rules */}
        <section className="bg-slate border border-azure/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-8 w-8 bg-azure/10 text-azure rounded-lg flex items-center justify-center font-black text-sm">3</span>
            <h3 className="text-lg font-bold text-ice">Regras de Elenco</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Mín. Jogadores por Time</label>
              <input 
                name="minPlayersPerTeam"
                type="number"
                defaultValue={1}
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-azure/50 uppercase tracking-[0.2em] font-black px-1">Máx. Jogadores por Time</label>
              <input 
                name="maxPlayersPerTeam"
                type="number"
                placeholder="Ex: 22"
                className="w-full bg-slate-dark border border-azure/20 rounded-xl px-4 py-3 text-ice focus:border-azure focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-azure to-blue-600 text-slate font-black py-5 rounded-2xl shadow-xl shadow-azure/20 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-[0.2em]"
        >
          Finalizar e Publicar Torneio
        </button>
      </form>
    </div>
  );
}
