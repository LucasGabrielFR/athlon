'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fetchApi } from '@/lib/api';

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'admin') redirect('/dashboard');
}

export async function createModalityAction(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const isTeamBased = formData.get('isTeamBased') === 'true';
  const positionsJson = formData.get('positionsJson') as string;

  if (!name) redirect('/dashboard/admin/modalities?error=missing_name');

  let positionsList = [];
  if (positionsJson) {
    try {
      positionsList = JSON.parse(positionsJson);
    } catch {}
  }

  try {
    await fetchApi('/modalities', {
      method: 'POST',
      body: JSON.stringify({ name, description, isTeamBased, positions: positionsList })
    });
  } catch (error) {
    // silently fail for now
  }

  redirect('/dashboard/admin/modalities');
}

export async function updateModalityAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const isTeamBased = formData.get('isTeamBased') === 'true';

  if (!id || !name) redirect('/dashboard/admin/modalities?error=invalid_data');

  try {
    await fetchApi(`/modalities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, isTeamBased })
    });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}

export async function deactivateModalityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) return;
  try {
    await fetchApi(`/modalities/${id}/deactivate`, { method: 'POST' });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}

export async function reactivateModalityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) return;
  try {
    await fetchApi(`/modalities/${id}/reactivate`, { method: 'POST' });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}

// ── Positions ──────────────────────────────

export async function createPositionAction(formData: FormData) {
  await requireAdmin();

  const modalityId = Number(formData.get('modalityId'));
  const name = formData.get('positionName') as string;
  const abbreviation = formData.get('abbreviation') as string;

  if (!modalityId || !name) return;

  try {
    await fetchApi(`/modalities/${modalityId}/positions`, {
      method: 'POST',
      body: JSON.stringify({ name, abbreviation })
    });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}

export async function deletePositionAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('positionId'));
  if (!id) return;

  try {
    await fetchApi(`/positions/${id}`, { method: 'DELETE' });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}

// ── Stat Types ─────────────────────────────

export async function createStatTypeAction(formData: FormData) {
  await requireAdmin();

  const modalityId = Number(formData.get('modalityId'));
  const name = formData.get('name') as string;
  const unit = formData.get('unit') as string;
  const isHigherBetter = formData.get('isHigherBetter') !== 'false';

  if (!modalityId || !name) return;

  try {
    await fetchApi(`/modalities/${modalityId}/stat-types`, {
      method: 'POST',
      body: JSON.stringify({ name, unit, isHigherBetter })
    });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}

export async function deleteStatTypeAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('statTypeId'));
  if (!id) return;

  try {
    await fetchApi(`/stat-types/${id}`, { method: 'DELETE' });
    revalidatePath('/dashboard/admin/modalities');
  } catch (error) {}
}
