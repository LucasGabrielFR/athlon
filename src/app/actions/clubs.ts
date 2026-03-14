'use server';

import { db } from '@/db';
import { clubs, clubMembers, clubInvitations, users, modalities } from '@/db/schema';
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

async function requireClubPresident(clubId: number, userId: number) {
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
  });
  if (!club || club.presidentId !== userId) {
    throw new Error('Acesso negado: apenas o presidente pode realizar esta ação.');
  }
  return club;
}

// ── Create Club ────────────────────────────────────────────────────────────

export async function createClubAction(formData: FormData) {
  const { userId } = await requireSession();

  const name = (formData.get('name') as string)?.trim();
  const tag = (formData.get('tag') as string)?.trim().toUpperCase();
  const location = (formData.get('location') as string)?.trim();
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;
  const modalityId = Number(formData.get('modalityId'));

  if (!name || !tag || !modalityId) {
    redirect('/dashboard/clubs/new?error=missing_fields');
  }

  if (tag.length > 5) {
    redirect('/dashboard/clubs/new?error=tag_too_long');
  }

  // Check if user is already in a club for this modality
  const alreadyInModality = await db.query.clubMembers.findFirst({
    where: and(eq(clubMembers.userId, userId), eq(clubMembers.modalityId, modalityId)),
  });
  if (alreadyInModality) {
    redirect('/dashboard/clubs/new?error=already_in_modality');
  }

  // Check if modality is team-based
  const modality = await db.query.modalities.findFirst({
    where: eq(modalities.id, modalityId),
  });
  if (!modality?.isTeamBased) {
    redirect('/dashboard/clubs/new?error=invalid_modality');
  }

  // Create the club
  const [newClub] = await db.insert(clubs).values({
    name,
    tag,
    location: location || null,
    logoUrl,
    presidentId: userId,
    modalityId,
  }).$returningId();

  if (!newClub?.id) redirect('/dashboard/clubs?error=creation_failed');

  // Add president to club_members as a player (they are president via clubs.presidentId)
  await db.insert(clubMembers).values({
    clubId: newClub.id,
    userId,
    modalityId,
    role: 'player',
  });

  // Upgrade user role to club_president
  await db.update(users)
    .set({ role: 'club_president' })
    .where(eq(users.id, userId));

  redirect(`/dashboard/clubs/${newClub.id}`);
}

// ── Invite Player (president → player) ─────────────────────────────────────

export async function invitePlayerAction(formData: FormData) {
  const { userId } = await requireSession();

  const clubId = Number(formData.get('clubId'));
  const targetUserId = Number(formData.get('targetUserId'));
  const modalityId = Number(formData.get('modalityId'));
  const message = (formData.get('message') as string)?.trim() || null;

  if (!clubId || !targetUserId || !modalityId) return;

  await requireClubPresident(clubId, userId);

  // Check if target is already a member
  const existingMember = await db.query.clubMembers.findFirst({
    where: and(
      eq(clubMembers.clubId, clubId),
      eq(clubMembers.userId, targetUserId),
      eq(clubMembers.modalityId, modalityId),
    ),
  });
  if (existingMember) {
    revalidatePath(`/dashboard/clubs/${clubId}`);
    return;
  }

  // Check no pending invite already exists
  const existingInvite = await db.query.clubInvitations.findFirst({
    where: and(
      eq(clubInvitations.clubId, clubId),
      eq(clubInvitations.userId, targetUserId),
      eq(clubInvitations.modalityId, modalityId),
      eq(clubInvitations.status, 'pending'),
      eq(clubInvitations.type, 'invite'),
    ),
  });
  if (existingInvite) {
    revalidatePath(`/dashboard/clubs/${clubId}`);
    return;
  }

  await db.insert(clubInvitations).values({
    clubId,
    userId: targetUserId,
    modalityId,
    type: 'invite',
    status: 'pending',
    message,
  });

  revalidatePath(`/dashboard/clubs/${clubId}`);
}

// ── Request to Join (player → club) ─────────────────────────────────────────

export async function requestJoinAction(formData: FormData) {
  const { userId } = await requireSession();
  const clubId = Number(formData.get('clubId'));
  const message = (formData.get('message') as string)?.trim() || null;

  if (!clubId) return;

  const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
  if (!club || !club.modalityId) return;
  const modalityId = club.modalityId;

  // Check if already a member in THIS modality (any club)
  const alreadyInModality = await db.query.clubMembers.findFirst({
    where: and(eq(clubMembers.userId, userId), eq(clubMembers.modalityId, modalityId)),
  });
  if (alreadyInModality) {
    revalidatePath(`/dashboard/clubs/${clubId}`);
    return;
  }

  // Check no pending request already exists for this modality (any club or specific club?)
  // User says "not registered in any club of the same modality"
  // So we check if they have a pending request for THIS modality to THIS club
  const existingRequest = await db.query.clubInvitations.findFirst({
    where: and(
      eq(clubInvitations.clubId, clubId),
      eq(clubInvitations.userId, userId),
      eq(clubInvitations.modalityId, modalityId),
      eq(clubInvitations.status, 'pending'),
      eq(clubInvitations.type, 'request'),
    ),
  });
  if (existingRequest) {
    revalidatePath(`/dashboard/clubs/${clubId}`);
    return;
  }

  await db.insert(clubInvitations).values({
    clubId,
    userId,
    modalityId,
    type: 'request',
    status: 'pending',
    message,
  });

  revalidatePath(`/dashboard/clubs/${clubId}`);
}

// ── Accept Invitation (player accepts invite from president) ─────────────────

export async function acceptInvitationAction(formData: FormData) {
  const { userId } = await requireSession();

  const invitationId = Number(formData.get('invitationId'));
  if (!invitationId) return;

  const invitation = await db.query.clubInvitations.findFirst({
    where: and(
      eq(clubInvitations.id, invitationId),
      eq(clubInvitations.userId, userId),
      eq(clubInvitations.type, 'invite'),
      eq(clubInvitations.status, 'pending'),
    ),
  });

  if (!invitation) return;

  await db.update(clubInvitations)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(clubInvitations.id, invitationId));

  await db.insert(clubMembers).values({
    clubId: invitation.clubId,
    userId: invitation.userId,
    modalityId: invitation.modalityId,
    role: 'player',
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/clubs/${invitation.clubId}`);
}

// ── Accept Join Request (president accepts player's request) ─────────────────

export async function acceptJoinRequestAction(formData: FormData) {
  const { userId } = await requireSession();

  const invitationId = Number(formData.get('invitationId'));
  if (!invitationId) return;

  const invitation = await db.query.clubInvitations.findFirst({
    where: and(
      eq(clubInvitations.id, invitationId),
      eq(clubInvitations.type, 'request'),
      eq(clubInvitations.status, 'pending'),
    ),
  });

  if (!invitation) return;

  await requireClubPresident(invitation.clubId, userId);

  await db.update(clubInvitations)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(clubInvitations.id, invitationId));

  await db.insert(clubMembers).values({
    clubId: invitation.clubId,
    userId: invitation.userId,
    modalityId: invitation.modalityId,
    role: 'player',
  });

  revalidatePath(`/dashboard/clubs/${invitation.clubId}`);
}

// ── Reject Invitation or Request ─────────────────────────────────────────────

export async function rejectInvitationAction(formData: FormData) {
  const { userId } = await requireSession();

  const invitationId = Number(formData.get('invitationId'));
  if (!invitationId) return;

  const invitation = await db.query.clubInvitations.findFirst({
    where: and(
      eq(clubInvitations.id, invitationId),
      eq(clubInvitations.status, 'pending'),
    ),
  });

  if (!invitation) return;

  // Only the target player (for invites) or the president (for requests) can reject
  const isTargetPlayer = invitation.type === 'invite' && invitation.userId === userId;
  let isPresidentActor = false;
  if (invitation.type === 'request') {
    const club = await db.query.clubs.findFirst({ where: eq(clubs.id, invitation.clubId) });
    isPresidentActor = club?.presidentId === userId;
  }

  if (!isTargetPlayer && !isPresidentActor) return;

  await db.update(clubInvitations)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(eq(clubInvitations.id, invitationId));

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/clubs/${invitation.clubId}`);
}

// ── Dismiss Player ─────────────────────────────────────────────────────────

export async function dismissPlayerAction(formData: FormData) {
  const { userId } = await requireSession();

  const memberId = Number(formData.get('memberId'));
  const clubId = Number(formData.get('clubId'));
  if (!memberId || !clubId) return;

  await requireClubPresident(clubId, userId);

  await db.delete(clubMembers).where(eq(clubMembers.id, memberId));

  revalidatePath(`/dashboard/clubs/${clubId}`);
}

// ── Leave Club ─────────────────────────────────────────────────────────────

export async function leaveClubAction(formData: FormData) {
  const { userId } = await requireSession();
  const clubId = Number(formData.get('clubId'));
  if (!clubId) return;

  const member = await db.query.clubMembers.findFirst({
    where: and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)),
  });

  if (!member) return;

  // Presidents cannot leave without disbanding or transferring (not implemented yet)
  const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
  if (club?.presidentId === userId) return;

  await db.delete(clubMembers).where(eq(clubMembers.id, member.id));

  revalidatePath(`/dashboard/clubs/${clubId}`);
  revalidatePath('/dashboard/clubs');
  redirect('/dashboard/clubs');
}
