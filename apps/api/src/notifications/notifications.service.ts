import { Injectable, Inject } from '@nestjs/common';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly gateway: NotificationsGateway,
  ) {}

  async getNotifications(userId: number, limit = 50) {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: number) {
    const unread = await db.select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return unread.length;
  }

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string = 'system',
    link?: string
  ) {
    const [result] = await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      link,
    }).$returningId();

    const insertedId = result?.id;
    if (insertedId) {
      // Fetch complete notification to send via WS
      const [newNotif] = await db.select().from(notifications).where(eq(notifications.id, insertedId));
      if (newNotif) {
        this.gateway.sendNotification(userId, newNotif);
      }
    }
  }

  async markAsRead(id: number, userId: number) {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return { success: true };
  }

  async markAllAsRead(userId: number) {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return { success: true };
  }
}
