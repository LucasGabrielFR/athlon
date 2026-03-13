'use server';

import { db } from '@/db';
import { modalities, positions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'admin') redirect('/dashboard');
}

// ── Modalities ─────────────────────────────

export async function createModalityAction(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const isTeamBased = formData.get('isTeamBased') === 'true';
  const positionsJson = formData.get('positionsJson') as string;

  if (!name) redirect('/dashboard/admin/modalities?error=missing_name');

  const [newModality] = await db.insert(modalities).values({
    name,
    description: description || null,
    isTeamBased,
    isActive: true,
  }).$returningId();

  // Insert positions if provided
  if (positionsJson && newModality?.id) {
    try {
      const positionsList: { name: string; abbreviation: string }[] = JSON.parse(positionsJson);
      if (positionsList.length > 0) {
        await db.insert(positions).values(
          positionsList.map((p) => ({
            modalityId: newModality.id,
            name: p.name,
            abbreviation: p.abbreviation || null,
          })),
        );
      }
    } catch {
      // silently ignore malformed JSON
    }
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

  await db.update(modalities)
    .set({ name, description: description || null, isTeamBased })
    .where(eq(modalities.id, id));

  revalidatePath('/dashboard/admin/modalities');
}

export async function deactivateModalityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) return;
  await db.update(modalities).set({ isActive: false }).where(eq(modalities.id, id));
  revalidatePath('/dashboard/admin/modalities');
}

export async function reactivateModalityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) return;
  await db.update(modalities).set({ isActive: true }).where(eq(modalities.id, id));
  revalidatePath('/dashboard/admin/modalities');
}

// ── Positions ──────────────────────────────

export async function createPositionAction(formData: FormData) {
  await requireAdmin();

  const modalityId = Number(formData.get('modalityId'));
  const name = formData.get('positionName') as string;
  const abbreviation = formData.get('abbreviation') as string;

  if (!modalityId || !name) return;

  await db.insert(positions).values({
    modalityId,
    name,
    abbreviation: abbreviation || null,
  });

  revalidatePath('/dashboard/admin/modalities');
}

export async function deletePositionAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('positionId'));
  if (!id) return;

  await db.delete(positions).where(eq(positions.id, id));

  revalidatePath('/dashboard/admin/modalities');
}
