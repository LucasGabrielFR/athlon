'use server';

import { db } from '@/db';
import { organizations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

async function requireOrganizationPresident(organizationId: number, userId: number, role: string) {
  if (role === 'admin') return; // Admins can do everything
  
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });
  
  if (!organization || organization.presidentId !== userId) {
    throw new Error('Acesso negado: apenas o presidente da organização pode realizar esta ação.');
  }
  return organization;
}

// ── Create Organization ─────────────────────────────────────────────────────

export async function createOrganizationAction(formData: FormData) {
  const { userId, role } = await requireSession();

  // Single Organization Constraint: One per user (Admin or Org President)
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.presidentId, userId),
  });

  if (existingOrg) {
    throw new Error('Você já possui uma organização vinculada. Não é possível criar mais de uma.');
  }

  const name = (formData.get('name') as string)?.trim();
  const tag = (formData.get('tag') as string)?.trim().toUpperCase();
  const description = (formData.get('description') as string)?.trim() || null;
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;

  if (!name || !tag) {
    redirect('/dashboard/organizations/new?error=missing_fields');
  }

  if (tag.length > 10) {
    redirect('/dashboard/organizations/new?error=tag_too_long');
  }

  // Create the organization
  const [newOrg] = await db.insert(organizations).values({
    name,
    tag,
    description,
    logoUrl,
    presidentId: userId,
  }).$returningId();

  if (!newOrg?.id) redirect('/dashboard/organizations?error=creation_failed');

  // Upgrade user role to org_president IF they are not admin
  if (role !== 'admin' && role !== 'org_president') {
    await db.update(users)
      .set({ role: 'org_president' })
      .where(eq(users.id, userId));
  }

  revalidatePath('/dashboard/organizations');
  redirect(`/dashboard/organizations/${newOrg.id}`);
}

// ── Update Organization ─────────────────────────────────────────────────────

export async function updateOrganizationAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const organizationId = Number(formData.get('organizationId'));

  if (!organizationId) return;

  await requireOrganizationPresident(organizationId, userId, role);

  const name = (formData.get('name') as string)?.trim();
  const tag = (formData.get('tag') as string)?.trim().toUpperCase();
  const description = (formData.get('description') as string)?.trim() || null;
  const logoUrl = (formData.get('logoUrl') as string)?.trim() || null;

  if (!name || !tag) return;

  await db.update(organizations)
    .set({
      name,
      tag,
      description,
      logoUrl,
    })
    .where(eq(organizations.id, organizationId));

  revalidatePath(`/dashboard/organizations/${organizationId}`);
  revalidatePath('/dashboard/organizations');
}

// ── Admin Organization Management ──────────────────────────────────────────

export async function deactivateOrganizationAction(formData: FormData) {
  const { role } = await requireSession();
  const organizationId = Number(formData.get('organizationId'));

  if (role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem gerenciar o status de organizações.');
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) throw new Error('Organização não encontrada.');

  const newStatus = org.status === 'deactivated' ? 'active' : 'deactivated';

  await db.update(organizations)
    .set({ status: newStatus })
    .where(eq(organizations.id, organizationId));

  revalidatePath(`/dashboard/organizations/${organizationId}`);
  revalidatePath('/dashboard/organizations');
}

export async function deleteOrganizationAction(formData: FormData) {
  const { role } = await requireSession();
  const organizationId = Number(formData.get('organizationId'));

  if (role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem excluir organizações.');
  }

  await db.delete(organizations)
    .where(eq(organizations.id, organizationId));

  revalidatePath('/dashboard/organizations');
  redirect('/dashboard/organizations');
}
