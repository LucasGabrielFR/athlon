import { auth } from '@/auth';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

export default async function OrganizationsPage() {
  const session = await auth();
  const userId = Number((session?.user as { id?: string | number }).id);

  // Fetch organizations presided by the user
  const myOrganizations = await db.query.organizations.findMany({
    where: eq(organizations.presidentId, userId),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-ice tracking-tight">Suas <span className="text-azure text-glow-azure">Organizações</span></h2>
          <p className="text-ice/40 mt-1">Gerencie suas federações e organize competições profissionais.</p>
        </div>
        {myOrganizations.length === 0 && (
          <Link 
            href="/dashboard/organizations/new"
            className="bg-azure hover:bg-azure-dark text-slate font-black px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-tighter shadow-xl shadow-azure/10"
          >
            <span>➕</span> Nova Organização
          </Link>
        )}
      </div>

      {myOrganizations.length === 0 ? (
        <div className="bg-slate border border-azure/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <span className="text-5xl mb-4 opacity-50">🏛️</span>
          <h3 className="text-ice font-bold text-xl mb-2">Nenhuma organização encontrada</h3>
          <p className="text-ice/40 max-w-sm mb-8 italic text-sm">
            Você ainda não fundou uma federação. Crie sua organização para começar a organizar torneios e ditar as regras do jogo.
          </p>
          <Link 
            href="/dashboard/organizations/new"
            className="text-azure hover:text-ice text-sm font-bold border border-azure/20 px-4 py-2 rounded-lg transition-colors"
          >
            Começar Agora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myOrganizations.map((org) => (
            <Link 
              key={org.id} 
              href={`/dashboard/organizations/${org.id}`}
              className="bg-slate border border-azure/10 rounded-2xl overflow-hidden hover:border-azure/30 transition-all group flex flex-col"
            >
              <div className="h-24 bg-gradient-to-br from-azure/20 to-transparent flex items-center justify-center">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="h-16 w-16 object-contain drop-shadow-2xl" />
                ) : (
                  <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform">🏛️</span>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-ice font-black group-hover:text-azure transition-colors">{org.name}</h3>
                    <p className="text-[10px] text-azure/50 uppercase tracking-widest font-bold">TAG: {org.tag}</p>
                  </div>
                </div>
                <p className="text-ice/40 text-xs line-clamp-2 mb-4 leading-relaxed italic">
                  {org.description || 'Sem descrição definida para esta federação.'}
                </p>
                <div className="pt-4 border-t border-azure/5 flex items-center justify-between">
                  <span className="text-[10px] text-ice/30 uppercase font-black">Admin Panel</span>
                  <span className="text-azure text-xs font-bold group-hover:translate-x-1 transition-transform">Gerenciar →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
