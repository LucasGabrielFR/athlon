'use server';

import { db } from '@/db';
import { playerProfiles, playerModalities, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function getSessionUserId(): Promise<number> {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!id) redirect('/login');
  return id;
}

export async function updateProfileAction(formData: FormData) {
  const userId = await getSessionUserId();

  const bio = formData.get('bio') as string;
  const avatarUrl = formData.get('avatarUrl') as string;
  const name = formData.get('name') as string;

  // Upsert player profile
  const existing = await db.query.playerProfiles.findFirst({
    where: eq(playerProfiles.userId, userId),
  });

  if (existing) {
    await db.update(playerProfiles)
      .set({ bio: bio || null, avatarUrl: avatarUrl || null })
      .where(eq(playerProfiles.userId, userId));
  } else {
    await db.insert(playerProfiles).values({
      userId,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
    });
  }

  // Update name in users table
  if (name) {
    await db.update(users).set({ name }).where(eq(users.id, userId));
  }

  revalidatePath('/dashboard/profile');
}

export async function addPlayerModalityAction(formData: FormData) {
  const userId = await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));
  const primaryPositionId = formData.get('primaryPositionId') ? Number(formData.get('primaryPositionId')) : null;
  const secondaryPositionId = formData.get('secondaryPositionId') ? Number(formData.get('secondaryPositionId')) : null;

  if (!modalityId) return;

  // Check if already linked
  const existing = await db.query.playerModalities.findFirst({
    where: and(
      eq(playerModalities.userId, userId),
      eq(playerModalities.modalityId, modalityId),
    ),
  });

  if (!existing) {
    await db.insert(playerModalities).values({ 
      userId, 
      modalityId,
      primaryPositionId,
      secondaryPositionId,
    });
  }

  revalidatePath('/dashboard/profile');
}

export async function removePlayerModalityAction(formData: FormData) {
  const userId = await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));

  await db.delete(playerModalities).where(
    and(
      eq(playerModalities.userId, userId),
      eq(playerModalities.modalityId, modalityId),
    ),
  );

  revalidatePath('/dashboard/profile');
}

export async function setActiveModalityAction(formData: FormData) {
  const userId = await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));

  const existing = await db.query.playerProfiles.findFirst({
    where: eq(playerProfiles.userId, userId),
  });

  if (existing) {
    await db.update(playerProfiles)
      .set({ activeModalityId: modalityId || null })
      .where(eq(playerProfiles.userId, userId));
  } else {
    await db.insert(playerProfiles).values({ userId, activeModalityId: modalityId || null });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
}

export async function updatePlayerModalityPositionsAction(formData: FormData) {
  const userId = await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));
  const primaryPositionId = formData.get('primaryPositionId') ? Number(formData.get('primaryPositionId')) : null;
  const secondaryPositionId = formData.get('secondaryPositionId') ? Number(formData.get('secondaryPositionId')) : null;

  if (!modalityId) return;

  await db.update(playerModalities)
    .set({
      primaryPositionId,
      secondaryPositionId,
    })
    .where(
      and(
        eq(playerModalities.userId, userId),
        eq(playerModalities.modalityId, modalityId),
      )
    );

  revalidatePath('/dashboard/profile');
}

export async function toggleFreeAgentStatusAction(formData: FormData) {
  const userId = await getSessionUserId();
  const modalityId = Number(formData.get('modalityId'));
  // Support both boolean and string representations
  let isFreeAgent = false;
  const isFreeAgentField = formData.get('isFreeAgent');
  if (isFreeAgentField === 'true' || isFreeAgentField === 'on') isFreeAgent = true;
  
  const freeAgentMessage = formData.get('freeAgentMessage') as string;

  if (!modalityId) return;

  await db.update(playerModalities)
    .set({
      isFreeAgent,
      freeAgentMessage: isFreeAgent ? freeAgentMessage || null : null,
    })
    .where(
      and(
        eq(playerModalities.userId, userId),
        eq(playerModalities.modalityId, modalityId),
      )
    );

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/players');
}
