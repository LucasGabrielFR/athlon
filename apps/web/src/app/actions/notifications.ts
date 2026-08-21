'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';

async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as { id?: string | number }).id);
  const role = (session.user as { role?: string }).role ?? 'player';
  return { userId, role };
}

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await fetchApi('/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {}
}

export async function markNotificationAsReadAction(id: number) {
  await requireSession();
  try {
    await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
    revalidatePath('/', 'layout');
  } catch (error) {}
}

export async function markAllNotificationsAsReadAction() {
  await requireSession();
  try {
    await fetchApi('/notifications/read-all', { method: 'PUT' });
    revalidatePath('/', 'layout');
  } catch (error) {}
}
