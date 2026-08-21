'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fetchApi } from '@/lib/api';

async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number(session.user.id);
  const role = session.user.role ?? 'player';
  return { userId, role };
}

export async function createOrganizationAction(formData: FormData) {
  await requireSession();
  const name = (formData.get('name') as string)?.trim();
  const tag = (formData.get('tag') as string)?.trim().toUpperCase();
  const description = (formData.get('description') as string)?.trim() || null;
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;

  try {
    const newOrg = await fetchApi('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name, tag, description, logoUrl })
    });
    revalidatePath('/dashboard/organizations');
    redirect(`/dashboard/organizations/${newOrg.id}`);
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    redirect('/dashboard/organizations/new?error=creation_failed');
  }
}

export async function updateOrganizationAction(formData: FormData) {
  await requireSession();
  const organizationId = Number(formData.get('organizationId'));
  if (!organizationId) return;

  const name = (formData.get('name') as string)?.trim();
  const tag = (formData.get('tag') as string)?.trim().toUpperCase();
  const description = (formData.get('description') as string)?.trim() || null;
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;

  try {
    await fetchApi(`/organizations/${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, tag, description, logoUrl })
    });
    revalidatePath(`/dashboard/organizations/${organizationId}`);
    revalidatePath('/dashboard/organizations');
  } catch (error) {
    // Silently fail for now
  }
}

export async function deactivateOrganizationAction(formData: FormData) {
  await requireSession();
  const organizationId = Number(formData.get('organizationId'));

  try {
    await fetchApi(`/organizations/${organizationId}/toggle-status`, { method: 'POST' });
    revalidatePath(`/dashboard/organizations/${organizationId}`);
    revalidatePath('/dashboard/organizations');
  } catch (error) {
    throw new Error('Acesso negado ou erro ao atualizar.');
  }
}

export async function deleteOrganizationAction(formData: FormData) {
  await requireSession();
  const organizationId = Number(formData.get('organizationId'));

  try {
    await fetchApi(`/organizations/${organizationId}`, { method: 'DELETE' });
    revalidatePath('/dashboard/organizations');
    redirect('/dashboard/organizations');
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    throw new Error('Acesso negado ou erro ao excluir.');
  }
}
