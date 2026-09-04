'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fetchApi } from '@/lib/api';

async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

export async function createClubAction(formData: FormData) {
  await requireSession();

  const name = (formData.get('name') as string)?.trim();
  const tag = (formData.get('tag') as string)?.trim().toUpperCase();
  const location = (formData.get('location') as string)?.trim();
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;
  const modalityId = Number(formData.get('modalityId'));

  try {
    const newClub = await fetchApi('/clubs', {
      method: 'POST',
      body: JSON.stringify({ name, tag, location, logoUrl, modalityId })
    });
    redirect(`/dashboard/clubs/${newClub.id}`);
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect('/dashboard/clubs/new?error=creation_failed');
  }
}

export async function updateClubAction(formData: FormData) {
  await requireSession();

  const clubId = Number(formData.get('clubId'));
  const location = (formData.get('location') as string)?.trim();
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;

  try {
    await fetchApi(`/clubs/${clubId}`, {
      method: 'PATCH',
      body: JSON.stringify({ location, logoUrl })
    });
    revalidatePath(`/dashboard/clubs/${clubId}`);
    redirect(`/dashboard/clubs/${clubId}`);
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect(`/dashboard/clubs/${clubId}/edit?error=update_failed`);
  }
}

export async function invitePlayerAction(formData: FormData) {
  await requireSession();
  const clubId = Number(formData.get('clubId'));
  const targetUserId = Number(formData.get('targetUserId'));
  const modalityId = Number(formData.get('modalityId'));
  const message = (formData.get('message') as string)?.trim() || null;

  try {
    await fetchApi(`/clubs/${clubId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, modalityId, message })
    });
    revalidatePath(`/dashboard/clubs/${clubId}`);
  } catch (e) {
    // silently fail for now
  }
}

export async function requestJoinAction(formData: FormData) {
  await requireSession();
  const clubId = Number(formData.get('clubId'));
  const message = (formData.get('message') as string)?.trim() || null;

  try {
    await fetchApi(`/clubs/${clubId}/requests`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    revalidatePath(`/dashboard/clubs/${clubId}`);
  } catch (e) {
    // silently fail
  }
}

export async function acceptInvitationAction(formData: FormData) {
  await requireSession();
  const invitationId = Number(formData.get('invitationId'));
  try {
    const result = await fetchApi(`/clubs/invites/${invitationId}/accept`, { method: 'PUT' });
    revalidatePath('/dashboard');
    if (result?.clubId) revalidatePath(`/dashboard/clubs/${result.clubId}`);
  } catch (e) {
    // silently fail
  }
}

export async function acceptJoinRequestAction(formData: FormData) {
  await requireSession();
  const invitationId = Number(formData.get('invitationId'));
  try {
    const result = await fetchApi(`/clubs/requests/${invitationId}/accept`, { method: 'PUT' });
    if (result?.clubId) revalidatePath(`/dashboard/clubs/${result.clubId}`);
  } catch (e) {
    // silently fail
  }
}

export async function rejectInvitationAction(formData: FormData) {
  await requireSession();
  const invitationId = Number(formData.get('invitationId'));
  try {
    const result = await fetchApi(`/clubs/invites/${invitationId}/reject`, { method: 'PUT' });
    revalidatePath('/dashboard');
    if (result?.clubId) revalidatePath(`/dashboard/clubs/${result.clubId}`);
  } catch (e) {
    // silently fail
  }
}

export async function dismissPlayerAction(formData: FormData) {
  await requireSession();
  const memberId = Number(formData.get('memberId'));
  const clubId = Number(formData.get('clubId'));

  try {
    await fetchApi(`/clubs/${clubId}/members/${memberId}`, { method: 'DELETE' });
    revalidatePath(`/dashboard/clubs/${clubId}`);
  } catch (e) {
    // silently fail
  }
}

export async function leaveClubAction(formData: FormData) {
  await requireSession();
  const clubId = Number(formData.get('clubId'));

  try {
    await fetchApi(`/clubs/${clubId}/leave`, { method: 'DELETE' });
    revalidatePath(`/dashboard/clubs/${clubId}`);
    revalidatePath('/dashboard/clubs');
    redirect('/dashboard/clubs');
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    // silently fail
  }
}
