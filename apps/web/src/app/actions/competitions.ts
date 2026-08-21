'use server';

import { fetchApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCompetitionAction(formData: FormData) {
  try {
    await fetchApi('/competitions', { method: 'POST', body: Object.fromEntries(formData) });
  } catch(e) {}
  redirect('/dashboard/competitions');
}

export async function registerClubAction(formData: FormData) {}
export async function approveRegistrationAction(formData: FormData) {}
export async function addToRosterAction(formData: FormData) {}
export async function removeFromRosterAction(formData: FormData) {}
export async function deleteCompetitionAction(formData: FormData) {}
export async function deactivateCompetitionAction(formData: FormData) {}
export async function updateCompetitionAction(formData: FormData) {}
export async function toggleManualStatusAction(formData: FormData) {}
export async function createCompetitionPostAction(formData: FormData) {}
export async function deleteCompetitionPostAction(formData: FormData) {}
export async function togglePinPostAction(formData: FormData) {}
export async function generateMatchesAction(formData: FormData) {}
export async function recordMatchEventAction(formData: FormData) {}
export async function updateMatchStatusAction(matchId: number, status: string) {}
export async function validateMatchAction(formData: FormData) {}
export async function submitMatchPlayerStatsAction(formData: FormData) {}
export async function finishCompetitionAction(formData: FormData) {}
export async function addPostCommentAction(formData: FormData) {}
export async function deletePostCommentAction(formData: FormData) {}
export async function togglePostReactionAction(formData: FormData) {}
export async function submitMatchReportAction(formData: FormData) {}
export async function acceptMatchSubmissionAction(formData: FormData) {}
export async function disputeMatchSubmissionAction(formData: FormData) {}
