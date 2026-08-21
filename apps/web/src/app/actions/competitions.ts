'use server';

import { fetchApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCompetitionAction(formData: FormData) {
  let createdId = null;
  try {
    const res = await fetchApi('/competitions', { 
      method: 'POST', 
      body: JSON.stringify(Object.fromEntries(formData)) 
    });
    if (res && res.id) {
      createdId = res.id;
    }
  } catch(e) {
    console.error(e);
  }
  
  if (createdId) {
    redirect(`/dashboard/competitions/${createdId}`);
  } else {
    redirect('/dashboard/competitions');
  }
}

export async function registerClubAction(formData: FormData) {
  const compId = formData.get('competitionId');
  try {
    await fetchApi(`/competitions/${compId}/registrations`, { method: 'POST', body: JSON.stringify(Object.fromEntries(formData)) });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function approveRegistrationAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const regId = formData.get('registrationId');
  try {
    await fetchApi(`/competitions/${compId}/registrations/${regId}/approve`, { method: 'PUT' });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function rejectRegistrationAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const regId = formData.get('registrationId');
  try {
    await fetchApi(`/competitions/${compId}/registrations/${regId}/reject`, { method: 'PUT' });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function addToRosterAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const regId = formData.get('registrationId');
  try {
    await fetchApi(`/competitions/${compId}/registrations/${regId}/roster`, { method: 'POST', body: JSON.stringify(Object.fromEntries(formData)) });
    revalidatePath(`/dashboard/competitions/${compId}/registration/${regId}`);
  } catch(e) {}
}

export async function removeFromRosterAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const regId = formData.get('registrationId');
  const userId = formData.get('userId');
  try {
    await fetchApi(`/competitions/${compId}/registrations/${regId}/roster/${userId}`, { method: 'DELETE' });
    revalidatePath(`/dashboard/competitions/${compId}/registration/${regId}`);
  } catch(e) {}
}

export async function deleteCompetitionAction(formData: FormData) {
  const compId = formData.get('competitionId');
  try {
    await fetchApi(`/competitions/${compId}`, { method: 'DELETE' });
  } catch(e) {}
  redirect('/dashboard/competitions');
}

export async function deactivateCompetitionAction(formData: FormData) {
  const compId = formData.get('competitionId');
  try {
    await fetchApi(`/competitions/${compId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'finished' }) });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function updateCompetitionAction(formData: FormData) {}
export async function toggleManualStatusAction(formData: FormData) {}

export async function createCompetitionPostAction(formData: FormData) {
  const compId = formData.get('competitionId');
  try {
    await fetchApi(`/competitions/${compId}/posts`, { method: 'POST', body: JSON.stringify(Object.fromEntries(formData)) });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function deleteCompetitionPostAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const postId = formData.get('postId');
  try {
    await fetchApi(`/competitions/${compId}/posts/${postId}`, { method: 'DELETE' });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function togglePinPostAction(formData: FormData) {}
export async function generateMatchesAction(formData: FormData) {
  const compId = formData.get('competitionId');
  try {
    await fetchApi(`/competitions/${compId}/generate-matches`, { method: 'POST' });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function generateKnockoutAction(formData: FormData) {
  const compId = formData.get('competitionId');
  try {
    await fetchApi(`/competitions/${compId}/generate-knockout`, { method: 'POST' });
    revalidatePath(`/dashboard/competitions/${compId}`);
  } catch(e) {}
}

export async function recordMatchEventAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const matchId = formData.get('matchId');
  try {
    await fetchApi(`/competitions/${compId}/matches/${matchId}/events`, { method: 'POST', body: JSON.stringify(Object.fromEntries(formData)) });
    revalidatePath(`/dashboard/competitions/${compId}/matches/${matchId}`);
  } catch(e) {}
}

export async function updateMatchStatusAction(compId: number, matchId: number, status: string) {
  try {
    await fetchApi(`/competitions/${compId}/matches/${matchId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    revalidatePath(`/dashboard/competitions/${compId}/matches/${matchId}`);
  } catch(e) {}
}

export async function submitMatchReportAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const matchId = formData.get('matchId');
  try {
    await fetchApi(`/competitions/${compId}/matches/${matchId}/report`, { method: 'POST', body: JSON.stringify(Object.fromEntries(formData)) });
    revalidatePath(`/dashboard/competitions/${compId}/matches/${matchId}`);
  } catch(e) {}
}

export async function acceptMatchSubmissionAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const matchId = formData.get('matchId');
  try {
    const body = { action: 'accept', homeScore: formData.get('homeScore'), awayScore: formData.get('awayScore') };
    await fetchApi(`/competitions/${compId}/matches/${matchId}/validate`, { method: 'POST', body: JSON.stringify(body) });
    revalidatePath(`/dashboard/competitions/${compId}/matches/${matchId}`);
  } catch(e) {}
}

export async function disputeMatchSubmissionAction(formData: FormData) {
  const compId = formData.get('competitionId');
  const matchId = formData.get('matchId');
  try {
    const body = { action: 'dispute' };
    await fetchApi(`/competitions/${compId}/matches/${matchId}/validate`, { method: 'POST', body: JSON.stringify(body) });
    revalidatePath(`/dashboard/competitions/${compId}/matches/${matchId}`);
  } catch(e) {}
}

export async function submitMatchPlayerStatsAction(formData: FormData) {}
export async function finishCompetitionAction(formData: FormData) {}
export async function addPostCommentAction(formData: FormData) {}
export async function deletePostCommentAction(formData: FormData) {}
export async function togglePostReactionAction(formData: FormData) {}
export async function validateMatchAction(formData: FormData) {}
