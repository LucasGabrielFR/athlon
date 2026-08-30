import { auth } from '@/auth';
import { fetchApi } from '@/lib/api';
import { AdminDashboard } from './components/AdminDashboard';
import { PlayerDashboard } from './components/PlayerDashboard';
import { ClubOwnerDashboard } from './components/ClubOwnerDashboard';
import { OrgPresidentDashboard } from './components/OrgPresidentDashboard';

export default async function DashboardPage() {
  const session = await auth();
  
  // Fetch unified dashboard stats based on user role
  const statsResponse = await fetchApi('/stats/dashboard');
  
  // Destructure response
  const roleType = statsResponse?.type || 'player';
  const data = statsResponse?.data || {};

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold text-ice">
          Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice to-azure">{(session?.user as any)?.name?.split(' ')[0] || 'Jogador'}</span> 👋
        </h2>
        <p className="text-ice/60 mt-1">
          {roleType === 'admin' && 'Painel de Administração Global.'}
          {roleType === 'org_president' && 'Bem-vindo ao seu painel de federação.'}
          {roleType === 'club_president' && 'Bem-vindo ao seu painel de gestão de clube.'}
          {roleType === 'player' && 'Bem-vindo ao seu painel de controle. O ecossistema competitivo te espera.'}
        </p>
      </div>

      {/* Role-based Dashboard Render */}
      {roleType === 'admin' && <AdminDashboard data={data} />}
      {roleType === 'org_president' && <OrgPresidentDashboard data={data} />}
      {roleType === 'club_president' && <ClubOwnerDashboard data={data} />}
      {roleType === 'player' && <PlayerDashboard data={data} />}
    </div>
  );
}
