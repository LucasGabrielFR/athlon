'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as { id?: string | number }).id);
  const role = (session.user as { role?: string }).role ?? 'player';
  return { userId, role };
}

/**
 * Creates a notification. Designed to be called internally by other server actions.
 */
export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link || null,
  });
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsReadAction(id: number) {
  const { userId } = await requireSession();

  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

  // Revalidar rotas comuns para garantir que a UI de notificação atualize
  revalidatePath('/', 'layout');
}

/**
 * Marks all notifications as read for the current user.
 */
export async function markAllNotificationsAsReadAction() {
  const { userId } = await requireSession();

  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));

  revalidatePath('/', 'layout');
}
