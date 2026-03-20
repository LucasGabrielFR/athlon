'use server';

import { db } from '@/db';
import { 
  competitions, 
  competitionRegistrations, 
  competitionRosters, 
  organizations, 
  clubs, 
  clubMembers,
  competitionPosts
} from '@/db/schema';

import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// ── Helpers ────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as { id?: string | number }).id);
  const role = (session.user as { role?: string }).role ?? 'player';
  return { userId, role };
}

async function requireOrganizerOrOrganizationPresident(competitionId: number, userId: number, role: string) {
  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, competitionId),
  });

  if (!comp) throw new Error('Competição não encontrada.');

  if (role === 'admin') return comp;

  if (comp.organizerId === userId) return comp;

  if (comp.organizationId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, comp.organizationId),
    });
    if (org?.presidentId === userId) return comp;
  }

  throw new Error('Acesso negado.');
}


// ── Competition Wizard ─────────────────────────────────────────────────────

export async function createCompetitionAction(formData: FormData) {
  const { userId, role } = await requireSession();

  const name = (formData.get('name') as string)?.trim();
  const modalityId = Number(formData.get('modalityId'));
  const organizationId = formData.get('organizationId') ? Number(formData.get('organizationId')) : null;
  const format = (formData.get('format') as string) || 'round_robin';
  const entryFee = Number(formData.get('entryFee')) || 0;
  const prizePool = Number(formData.get('prizePool')) || 0;
  
  const maxTeams = formData.get('maxTeams') ? Number(formData.get('maxTeams')) : null;
  const minPlayersPerTeam = Number(formData.get('minPlayersPerTeam')) || 1;
  const maxPlayersPerTeam = formData.get('maxPlayersPerTeam') ? Number(formData.get('maxPlayersPerTeam')) : null;

  // Registration Schedule
  const registrationStartDate = formData.get('registrationStartDate') ? new Date(formData.get('registrationStartDate') as string) : null;
  const registrationEndDate = formData.get('registrationEndDate') ? new Date(formData.get('registrationEndDate') as string) : null;
  
  const windowType = formData.get('windowType') as string;
  let registrationWindows = null;
  if (windowType && windowType !== 'none') {
    registrationWindows = {
      type: windowType,
      day: Number(formData.get('windowDay')) || 1,
      duration: Number(formData.get('windowDuration')) || 1,
    };
  }


  if (!name || !modalityId || !organizationId) {
    redirect('/dashboard/competitions/new?error=missing_fields');
  }

  // Enforce: Only Org President or Admin can create
  if (role !== 'admin' && role !== 'org_president') {
    throw new Error('Apenas presidentes de organização podem criar competições.');
  }

  // Verify ownership of the organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org || org.presidentId !== userId) {
    throw new Error('Você deve ser o presidente da organização selecionada para criar uma competição nela.');
  }

  const [newComp] = await db.insert(competitions).values({
    name,
    modalityId,
    organizationId,
    organizerId: userId,
    format,
    entryFee,
    prizePool,
    maxTeams,
    minPlayersPerTeam,
    maxPlayersPerTeam,
    registrationStartDate,
    registrationEndDate,
    registrationWindows,
    status: 'planned',

  }).$returningId();

  if (!newComp?.id) redirect('/dashboard/competitions?error=creation_failed');

  revalidatePath('/dashboard/competitions');
  redirect(`/dashboard/competitions/${newComp.id}`);
}

// ── Club Registration ──────────────────────────────────────────────────────

export async function registerClubAction(formData: FormData) {
  const { userId } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));
  const clubId = Number(formData.get('clubId'));

  if (!competitionId || !clubId) return;

  // Verify user is club president
  const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
  if (!club || club.presidentId !== userId) {
    throw new Error('Apenas o presidente do clube pode inscrever a equipe.');
  }

  // Check if already registered
  const existing = await db.query.competitionRegistrations.findFirst({
    where: and(
      eq(competitionRegistrations.competitionId, competitionId),
      eq(competitionRegistrations.clubId, clubId)
    ),
  });

  if (existing) return;

  await db.insert(competitionRegistrations).values({
    competitionId,
    clubId,
    status: 'pending',
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

// ── Approve Registration ───────────────────────────────────────────────────

export async function approveRegistrationAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const registrationId = Number(formData.get('registrationId'));

  if (!registrationId) return;

  const reg = await db.query.competitionRegistrations.findFirst({
    where: eq(competitionRegistrations.id, registrationId),
  });

  if (!reg) return;

  await requireOrganizerOrOrganizationPresident(reg.competitionId, userId, role);

  await db.update(competitionRegistrations)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(competitionRegistrations.id, registrationId));

  revalidatePath(`/dashboard/competitions/${reg.competitionId}`);
}

// ── Roster Management ──────────────────────────────────────────────────────

export async function addToRosterAction(formData: FormData) {
  const { userId } = await requireSession();
  const registrationId = Number(formData.get('registrationId'));
  const targetUserId = Number(formData.get('targetUserId'));

  if (!registrationId || !targetUserId) return;

  const reg = await db.query.competitionRegistrations.findFirst({
    where: eq(competitionRegistrations.id, registrationId),
  });

  if (!reg) return;

  // Verify club president
  const club = await db.query.clubs.findFirst({ where: eq(clubs.id, reg.clubId) });
  if (!club || club.presidentId !== userId) return;

  // Verify competition limits
  const comp = await db.query.competitions.findFirst({ where: eq(competitions.id, reg.competitionId) });
  if (comp?.maxPlayersPerTeam) {
    const currentRoster = await db.query.competitionRosters.findMany({
      where: eq(competitionRosters.registrationId, registrationId),
    });
    if (currentRoster.length >= comp.maxPlayersPerTeam) {
      throw new Error(`Limite de ${comp.maxPlayersPerTeam} jogadores atingido.`);
    }
  }

  // Add to roster
  await db.insert(competitionRosters).values({
    registrationId,
    userId: targetUserId,
  });

  revalidatePath(`/dashboard/competitions/${reg.competitionId}/roster`);
}

// ── Admin Management ───────────────────────────────────────────────────────

export async function deleteCompetitionAction(formData: FormData) {
  const { role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  if (role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem excluir competições.');
  }

  // DB cascades handle recursive deletion of registrations and rosters
  await db.delete(competitions).where(eq(competitions.id, competitionId));

  revalidatePath('/dashboard/competitions');
  redirect('/dashboard/competitions');
}

export async function deactivateCompetitionAction(formData: FormData) {
  const { role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  if (role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem gerenciar o status de competições.');
  }

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, competitionId),
  });

  if (!comp) throw new Error('Competição não encontrada.');

  const newStatus = comp.status === 'deactivated' ? 'planned' : 'deactivated';

  await db.update(competitions)
    .set({ status: newStatus })
    .where(eq(competitions.id, competitionId));

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

// ── Competition Management ──────────────────────────────────────────────────

export async function updateCompetitionAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  const comp = await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const rulesJson = formData.get('rulesJson') ? JSON.parse(formData.get('rulesJson') as string) : comp.rulesJson;

  // Fields with restrictions if status !== 'planned'
  const updates: any = { name, description, rulesJson };

  if (comp.status === 'planned' || role === 'admin') {
    updates.maxTeams = formData.get('maxTeams') ? Number(formData.get('maxTeams')) : comp.maxTeams;
    updates.minPlayersPerTeam = formData.get('minPlayersPerTeam') ? Number(formData.get('minPlayersPerTeam')) : comp.minPlayersPerTeam;
    updates.maxPlayersPerTeam = formData.get('maxPlayersPerTeam') ? Number(formData.get('maxPlayersPerTeam')) : comp.maxPlayersPerTeam;
    updates.entryFee = formData.get('entryFee') ? Number(formData.get('entryFee')) : comp.entryFee;
    updates.prizePool = formData.get('prizePool') ? Number(formData.get('prizePool')) : comp.prizePool;
  }

  await db.update(competitions)
    .set(updates)
    .where(eq(competitions.id, competitionId));

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

export async function toggleManualStatusAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));
  const field = formData.get('field') as 'isRegistrationManualOpen' | 'isWindowManualOpen';

  const comp = await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

  const newValue = !comp[field];

  await db.update(competitions)
    .set({ [field]: newValue })
    .where(eq(competitions.id, competitionId));

  // Create system post
  const message = field === 'isRegistrationManualOpen' 
    ? (newValue ? "🚀 Inscrições abertas manualmente pelo organizador." : "🔒 Inscrições encerradas manualmente pelo organizador.")
    : (newValue ? "🔄 Janela de transferências aberta manualmente." : "⏹️ Janela de transferências encerrada manualmente.");

  await db.insert(competitionPosts).values({
    competitionId,
    authorId: userId,
    type: 'system',
    content: message,
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

export async function createCompetitionPostAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));
  const content = (formData.get('content') as string)?.trim();

  if (!content) return;

  await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

  await db.insert(competitionPosts).values({
    competitionId,
    authorId: userId,
    type: 'post',
    content,
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

export async function togglePinPostAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const postId = Number(formData.get('postId'));

  const post = await db.query.competitionPosts.findFirst({
    where: eq(competitionPosts.id, postId),
  });

  if (!post) return;

  await requireOrganizerOrOrganizationPresident(post.competitionId, userId, role);

  await db.update(competitionPosts)
    .set({ isPinned: !post.isPinned })
    .where(eq(competitionPosts.id, postId));

  revalidatePath(`/dashboard/competitions/${post.competitionId}`);
}

