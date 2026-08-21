import { auth } from '@/auth';
import { fetchApi } from '@/lib/api';
import { createCompetitionAction } from '@/app/actions/competitions';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NewCompetitionForm } from './new-competition-form';

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

  let user: any = null;
  let allModalities: any[] = [];
  let myOrganizations: any[] = [];

  try {
    const data = await fetchApi('/competitions/new-form-data');
    user = data?.user;
    allModalities = data?.modalities || [];
    myOrganizations = data?.organizations || [];
  } catch(e) {}

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

      <NewCompetitionForm 
        allModalities={allModalities}
        myOrganizations={myOrganizations}
        organizationId={organizationId}
        isAdmin={userRole === 'admin'}
        planTier={user?.planTier || 'free'}
      />
    </div>
  );
}
