import { auth } from '@/auth';
import { db } from '@/db';
import { organizations, competitions, modalities } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConfirmButton } from '@/components/confirm-button';
import { deleteOrganizationAction, deactivateOrganizationAction } from '@/app/actions/organizations';

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organizationId = Number(id);
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    with: { president: true }
  });

  if (!organization) notFound();

  const isPresident = organization.presidentId === userId || (session?.user as any)?.role === 'admin';

  const organizationCompetitions = await db.query.competitions.findMany({
    where: eq(competitions.organizationId, organizationId),
    orderBy: [desc(competitions.createdAt)],
    with: { modality: true }
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-slate border border-azure/20 rounded-3xl flex items-center justify-center p-4 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-azure/5 group-hover:bg-azure/10 transition-colors"></div>
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt={organization.name} className="relative z-10 h-full w-full object-contain" />
            ) : (
              <span className="relative z-10 text-4xl">🏛️</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-azure/10 text-azure px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Federação</span>
              <span className="text-[10px] bg-ice/5 text-ice/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">#{organization.tag}</span>
            </div>
            <h1 className="text-4xl font-black text-ice tracking-tight">{organization.name}</h1>
            <p className="text-ice/40 text-sm mt-1 max-w-xl italic">{organization.description || 'Nenhuma descrição fornecida.'}</p>
          </div>
        </div>
        {isPresident && (
          <div className="flex items-center gap-3">
            <Link 
              href={`/dashboard/competitions/new?organizationId=${organizationId}`}
              className="bg-azure hover:bg-azure-dark text-slate font-black px-6 py-3 rounded-xl transition-all shadow-xl shadow-azure/10 flex items-center gap-2 text-sm uppercase tracking-tighter"
            >
              <span>🏆</span> Criar Competição
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Competitions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ice flex items-center gap-2">
              <span className="text-azure">Competições</span> Ativas
            </h2>
            <span className="text-xs text-ice/20">{organizationCompetitions.length} registro(s)</span>
          </div>

          {organizationCompetitions.length === 0 ? (
            <div className="bg-slate-dark/50 border border-azure/5 rounded-2xl p-12 text-center">
              <p className="text-ice/20 italic text-sm">Nenhuma competição organizada por esta federação ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {organizationCompetitions.map((comp) => (
                <Link 
                  key={comp.id}
                  href={`/dashboard/competitions/${comp.id}`}
                  className="bg-slate border border-azure/10 p-5 rounded-2xl flex items-center justify-between hover:border-azure/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-azure/5 rounded-xl flex items-center justify-center text-xl group-hover:bg-azure/10 transition-colors">
                      {comp.format === 'knockout' ? '⚔️' : '📈'}
                    </div>
                    <div>
                      <h3 className="text-ice font-bold group-hover:text-azure transition-colors">{comp.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-azure/60 font-black uppercase tracking-widest">{comp.modality?.name}</span>
                        <span className="text-[10px] text-ice/20">•</span>
                        <span className="text-[10px] text-ice/40 font-bold uppercase tracking-widest">{comp.format === 'knockout' ? 'Mata-mata' : 'Pontos Corridos'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mb-1 ${
                      comp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                      comp.status === 'registration' ? 'bg-azure/10 text-azure' : 'bg-ice/5 text-ice/30'
                    }`}>
                      {comp.status}
                    </div>
                    <p className="text-[10px] text-ice/20 font-bold">Criada em {new Date(comp.createdAt!).toLocaleDateString('pt-BR')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Stats */}
        <div className="space-y-6">
          <div className="bg-slate-dark/30 border border-azure/10 rounded-2xl p-6">
            <h3 className="text-sm font-black text-azure uppercase tracking-[0.2em] mb-4">Informações</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-ice/30 uppercase font-black mb-1">Presidente</p>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-azure/20 rounded-full"></div>
                  <p className="text-ice font-bold text-sm tracking-tight">{organization.president?.name}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-azure/5">
                <p className="text-[10px] text-ice/30 uppercase font-black mb-1">Data de Fundação</p>
                <p className="text-ice text-sm font-medium">{new Date(organization.createdAt!).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-azure/10 to-transparent border border-azure/10 rounded-2xl p-6">
            <h3 className="text-sm font-black text-ice uppercase tracking-[0.1em] mb-4">Regras Gerais</h3>
            <p className="text-ice/40 text-xs leading-relaxed italic">
              Esta organização segue os padrões oficiais da Athlon Competitions. Todas as súmulas devem ser validadas pelo presidente da federação antes da oficialização de resultados.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone for Admins */}
      {(session?.user as any)?.role === 'admin' && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 max-w-4xl mx-auto mt-20">
          <h3 className="text-xl font-black text-red-500 mb-2 italic">⚠️ Danger Zone</h3>
          <p className="text-ice/40 text-sm mb-6 max-w-md">
            Funcionalidades restritas ao administrador do sistema. A exclusão de uma organização removerá permanentemente todas as suas competições e dados vinculados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <form action={deactivateOrganizationAction}>
              <input type="hidden" name="organizationId" value={organizationId} />
              <ConfirmButton 
                type="submit"
                confirmMessage={organization.status === 'deactivated' ? "Deseja REATIVAR esta federação?" : "Deseja DESATIVAR esta federação?"}
                className={`bg-slate-dark hover:bg-slate-light border rounded-xl transition-all font-black text-[10px] uppercase tracking-widest px-8 py-3 ${
                  organization.status === 'deactivated' ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400/60 hover:text-red-400'
                }`}
              >
                {organization.status === 'deactivated' ? 'Reativar Federação' : 'Desativar Federação'}
              </ConfirmButton>
            </form>

            <form action={deleteOrganizationAction}>
              <input type="hidden" name="organizationId" value={organizationId} />
              <ConfirmButton 
                type="submit"
                confirmMessage="Você tem certeza que deseja EXCLUIR permanentemente esta federação? Todas as competições e dados vinculados serão deletados para sempre."
                className="bg-red-500 hover:bg-red-600 text-slate font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 text-[10px] uppercase tracking-widest"
              >
                Excluir Permanentemente
              </ConfirmButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
