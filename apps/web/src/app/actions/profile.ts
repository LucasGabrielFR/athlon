'use server';

import { auth } from '@/auth';
import { fetchApi } from '@/lib/api';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function getSessionUserId(): Promise<number> {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!id) redirect('/login');
  return id;
}

export async function updateProfileAction(prevState: any, formData: FormData) {
  await getSessionUserId();
  const bio = formData.get('bio') as string;
  const avatarUrl = formData.get('avatarUrl') as string;
  const name = formData.get('name') as string;
  const nickname = formData.get('nickname') as string;
  const birthDate = formData.get('birthDate') as string;
  const location = formData.get('location') as string;

  try {
    await fetchApi('/profile', {
      method: 'PUT',
      body: JSON.stringify({ bio, avatarUrl, name, nickname, birthDate, location })
    });
    revalidatePath('/dashboard/profile');
    return { success: true, timestamp: Date.now() };
  } catch (error: any) {
    if (error.message === 'NICKNAME_TAKEN' || error.response?.message === 'NICKNAME_TAKEN') {
      return { error: 'Este nickname já está em uso.' };
    }
    return { error: 'Ocorreu um erro ao atualizar o perfil.' };
  }
}

export async function addPlayerModalityAction(formData: FormData) {
  await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));
  const primaryPositionId = formData.get('primaryPositionId') ? Number(formData.get('primaryPositionId')) : null;
  const secondaryPositionId = formData.get('secondaryPositionId') ? Number(formData.get('secondaryPositionId')) : null;

  if (!modalityId) return;

  try {
    await fetchApi('/profile/modalities', {
      method: 'POST',
      body: JSON.stringify({ modalityId, primaryPositionId, secondaryPositionId })
    });
    revalidatePath('/dashboard/profile');
  } catch (error) {
    // Handle error
  }
}

export async function removePlayerModalityAction(formData: FormData) {
  await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));

  try {
    await fetchApi(`/profile/modalities/${modalityId}`, { method: 'DELETE' });
    revalidatePath('/dashboard/profile');
  } catch (error) {
    // Handle error
  }
}

export async function setActiveModalityAction(formData: FormData) {
  await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));

  try {
    await fetchApi('/profile/active-modality', {
      method: 'PUT',
      body: JSON.stringify({ modalityId })
    });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
  } catch (error) {
    // Handle error
  }
}

export async function updatePlayerModalityPositionsAction(formData: FormData) {
  await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));
  const primaryPositionId = formData.get('primaryPositionId') ? Number(formData.get('primaryPositionId')) : null;
  const secondaryPositionId = formData.get('secondaryPositionId') ? Number(formData.get('secondaryPositionId')) : null;

  if (!modalityId) return;

  try {
    await fetchApi(`/profile/modalities/${modalityId}/positions`, {
      method: 'PUT',
      body: JSON.stringify({ primaryPositionId, secondaryPositionId })
    });
    revalidatePath('/dashboard/profile');
  } catch (error) {
    // Handle error
  }
}

export async function toggleFreeAgentStatusAction(formData: FormData) {
  await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));
  let isFreeAgent = false;
  const isFreeAgentField = formData.get('isFreeAgent');
  if (isFreeAgentField === 'true' || isFreeAgentField === 'on') isFreeAgent = true;
  
  const freeAgentMessage = formData.get('freeAgentMessage') as string;

  if (!modalityId) return;

  try {
    await fetchApi(`/profile/modalities/${modalityId}/free-agent`, {
      method: 'PUT',
      body: JSON.stringify({ isFreeAgent, freeAgentMessage })
    });
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/players');
  } catch (error) {
    // Handle error
  }
}
