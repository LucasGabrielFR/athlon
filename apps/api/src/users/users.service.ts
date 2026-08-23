import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { 
  users, 
  playerProfiles, 
  playerModalities,
  clubs,
  organizations,
  clubInvitations,
  notifications,
  modalities,
  trophies,
  clubMembers
} from '../db/schema';
import { eq, and, like, or, SQL, inArray, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  async findOneByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async findOneById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async create(data: typeof users.$inferInsert) {
    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }
    const [result] = await db.insert(users).values(data);
    return this.findOneById(result.insertId);
  }

  async getMe(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        presidedClubs: true,
      }
    });
    
    if (!user) return null;
    
    const profile = await db.query.playerProfiles.findFirst({
      where: eq(playerProfiles.userId, userId)
    });

    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, profile };
  }

  async getActiveModality(userId: number) {
    const profile = await db.query.playerProfiles.findFirst({
      where: eq(playerProfiles.userId, userId),
      with: { activeModality: true }
    });
    return profile?.activeModality || null;
  }

  async getNotifications(userId: number, limit: number = 10) {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      limit
    });
  }

  async getPendingInvitations(userId: number) {
    return await db.query.clubInvitations.findMany({
      where: and(
        eq(clubInvitations.userId, userId),
        eq(clubInvitations.type, 'invite'),
        eq(clubInvitations.status, 'pending')
      ),
      with: { club: true, modality: true }
    });
  }

  async getPresidedClubs(userId: number) {
    return await db.query.clubs.findMany({
      where: eq(clubs.presidentId, userId),
      with: { modality: true }
    });
  }

  async getPresidedOrganizations(userId: number) {
    return await db.query.organizations.findMany({
      where: eq(organizations.presidentId, userId)
    });
  }

  async getMemberships(userId: number) {
    return await db.query.clubMembers.findMany({
      where: eq(clubMembers.userId, userId),
      with: { club: true, modality: true }
    });
  }

  async getFullProfile(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) return null;

    const profile = await db.query.playerProfiles.findFirst({
      where: eq(playerProfiles.userId, userId),
    });

    const modalities = await db.query.playerModalities.findMany({
      where: eq(playerModalities.userId, userId),
      with: {
        modality: true,
        primaryPosition: true,
        secondaryPosition: true,
      }
    });

    // Also get trophies and clubs
    const userTrophies = await db.query.trophies.findMany({
      where: eq(trophies.userId, userId),
      with: { competition: { with: { modality: true } }, club: true }
    });

    const memberships = await db.query.clubMembers.findMany({
      where: eq(clubMembers.userId, userId),
      with: { club: true, modality: true }
    });

    const { passwordHash, ...safeUser } = user;
    return { 
      ...safeUser, 
      profile, 
      modalities,
      trophies: userTrophies,
      memberships,
    };
  }

  async updateProfile(userId: number, data: any) {
    // Update user name/image
    if (data.name || data.avatarUrl) {
      await db.update(users).set({
        name: data.name,
        image: data.avatarUrl,
        updatedAt: new Date()
      }).where(eq(users.id, userId));
    }

    // Update profile bio
    const existing = await db.query.playerProfiles.findFirst({
      where: eq(playerProfiles.userId, userId)
    });
    if (existing) {
      await db.update(playerProfiles).set({
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        updatedAt: new Date()
      }).where(eq(playerProfiles.userId, userId));
    } else {
      await db.insert(playerProfiles).values({
        userId,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      });
    }
    return { success: true };
  }

  async addPlayerModality(userId: number, data: any) {
    await db.insert(playerModalities).values({
      userId,
      modalityId: data.modalityId,
      primaryPositionId: data.primaryPositionId || null,
      secondaryPositionId: data.secondaryPositionId || null,
    });
    return { success: true };
  }

  async removePlayerModality(userId: number, modalityId: number) {
    await db.delete(playerModalities).where(
      and(
        eq(playerModalities.userId, userId),
        eq(playerModalities.modalityId, modalityId)
      )
    );
    return { success: true };
  }

  async setActiveModality(userId: number, modalityId: number) {
    await db.update(playerProfiles)
      .set({ activeModalityId: modalityId, updatedAt: new Date() })
      .where(eq(playerProfiles.userId, userId));
    return { success: true };
  }

  async updatePlayerModalityPositions(userId: number, modalityId: number, data: any) {
    await db.update(playerModalities)
      .set({
        primaryPositionId: data.primaryPositionId || null,
        secondaryPositionId: data.secondaryPositionId || null,
      })
      .where(
        and(
          eq(playerModalities.userId, userId),
          eq(playerModalities.modalityId, modalityId)
        )
      );
    return { success: true };
  }

  async toggleFreeAgentStatus(userId: number, modalityId: number, data: any) {
    await db.update(playerModalities)
      .set({
        isFreeAgent: data.isFreeAgent,
        freeAgentMessage: data.freeAgentMessage || null,
      })
      .where(
        and(
          eq(playerModalities.userId, userId),
          eq(playerModalities.modalityId, modalityId)
        )
      );
    return { success: true };
  }

  async searchPlayers(filters: {
    page: number;
    limit: number;
    modalityId?: number;
    positionId?: number;
    status?: string;
    query?: string;
  }) {
    const offset = (filters.page - 1) * filters.limit;
    const conditions: SQL[] = [];

    if (filters.query) {
      conditions.push(
        or(
          like(users.name, `%${filters.query}%`),
          like(users.nickname, `%${filters.query}%`)
        )!
      );
    }

    let userIdsWithModality: number[] | null = null;
    if (filters.modalityId || filters.positionId || filters.status === 'free') {
      const pmConditions: SQL[] = [];
      if (filters.modalityId) pmConditions.push(eq(playerModalities.modalityId, filters.modalityId));
      if (filters.positionId) {
        pmConditions.push(
          or(
            eq(playerModalities.primaryPositionId, filters.positionId),
            eq(playerModalities.secondaryPositionId, filters.positionId)
          )!
        );
      }
      if (filters.status === 'free') {
        pmConditions.push(eq(playerModalities.isFreeAgent, true));
      }
      
      const pms = await db.select({ userId: playerModalities.userId })
                          .from(playerModalities)
                          .where(and(...pmConditions));
                          
      userIdsWithModality = pms.map(pm => pm.userId);
      if (userIdsWithModality.length === 0) {
        return { data: [], total: 0 };
      }
    }

    if (userIdsWithModality !== null) {
      conditions.push(inArray(users.id, userIdsWithModality));
    }

    // Only show players, not admins
    conditions.push(eq(users.role, 'player'));

    const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.users.findMany({
      where: finalCondition,
      limit: filters.limit,
      offset,
      with: {
        playerProfile: true,
        memberships: {
          with: { club: true }
        }
      }
    });

    if (data.length === 0) {
      return { data: [], total: 0 };
    }

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(finalCondition);

    const pms = await db.query.playerModalities.findMany({
       where: inArray(playerModalities.userId, data.map(u => u.id)),
       with: { modality: true }
    });

    const formatted = data.map(user => {
      const userPms = pms.filter(pm => pm.userId === user.id);
      
      const formattedModalities = userPms.map(pm => {
        const clubMember = user.memberships.find(m => m.modalityId === pm.modalityId);
        
        return {
          id: pm.modality.id,
          name: pm.modality.name,
          isInClub: !!clubMember,
          clubName: clubMember ? clubMember.club.name : null,
          isFreeAgent: pm.isFreeAgent,
          freeAgentMessage: pm.freeAgentMessage
        };
      });

      return {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.playerProfile?.avatarUrl || user.image,
        modalities: formattedModalities
      };
    });

    return {
      data: formatted,
      total: Number(count)
    };
  }
}
