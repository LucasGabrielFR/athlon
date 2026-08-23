import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { db } from '../db';
import { clubs, clubMembers, clubInvitations, users, modalities, transferHistory } from '../db/schema';
import { eq, and, like, or } from 'drizzle-orm';

@Injectable()
export class ClubsService {
  
  async searchClubs(query?: string, modalityId?: number, page: number = 1, limit: number = 20) {
    let conditions = [];
    if (query) {
      conditions.push(or(like(clubs.name, `%${query}%`), like(clubs.tag, `%${query}%`)));
    }
    if (modalityId) {
      conditions.push(eq(clubs.modalityId, modalityId));
    }
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.query.clubs.findMany({
      where: whereCondition,
      with: {
        modality: true,
        president: {
          columns: { id: true, name: true, nickname: true, image: true }
        }
      },
      limit: limit,
      offset: (page - 1) * limit
    });
    
    // Quick count (since drizzle doesn't have a simple count query out of the box we do a simple select)
    const countResults = await db.select({ id: clubs.id }).from(clubs).where(whereCondition);
    
    return {
      data: results,
      total: countResults.length
    };
  }

  async getClubDetails(clubId: number, reqUserId?: number) {
    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, clubId),
      with: {
        modality: true,
        president: {
          columns: { id: true, name: true, nickname: true, image: true }
        },
        members: {
          with: {
            user: {
              columns: { id: true, name: true, nickname: true, image: true }
            }
          }
        },
        invitations: {
          where: eq(clubInvitations.status, 'pending'),
          with: {
            user: {
              columns: { id: true, name: true, nickname: true, image: true }
            }
          }
        }
      }
    });

    if (!club) throw new NotFoundException('Club not found');

    const isPresident = reqUserId && club.presidentId === reqUserId;

    const formattedMembers = club.members.map((m: any) => ({
      memberId: m.id,
      userId: m.user.id,
      userName: m.user.name,
      userNickname: m.user.nickname,
      role: m.role,
      modalityName: club.modality?.name,
      primaryPosition: null
    }));

    let joinRequests: any[] = [];
    let outgoingInvites: any[] = [];
    
    if (isPresident) {
      joinRequests = club.invitations
        .filter(inv => inv.type === 'request')
        .map(inv => ({
          inviteId: inv.id,
          userName: inv.user.name,
          userNickname: inv.user.nickname,
          modalityName: club.modality?.name,
          message: inv.message
        }));

      outgoingInvites = club.invitations
        .filter(inv => inv.type === 'invite')
        .map(inv => ({
          inviteId: inv.id,
          userName: inv.user.name,
          userNickname: inv.user.nickname,
          modalityName: club.modality?.name
        }));
    }

    let myPendingRequest = false;
    let alreadyInSameModality = false;

    if (reqUserId) {
      const pendingReq = club.invitations.find(inv => inv.userId === reqUserId && inv.type === 'request' && inv.status === 'pending');
      myPendingRequest = !!pendingReq;

      if (club.modalityId) {
        const otherMembership = await db.query.clubMembers.findFirst({
           where: and(eq(clubMembers.userId, reqUserId), eq(clubMembers.modalityId, club.modalityId))
        });
        alreadyInSameModality = !!otherMembership;
      }
    }

    // Return the specific object shape expected by the frontend
    return {
      club,
      clubTrophies: [],
      members: formattedMembers,
      myPendingRequest,
      alreadyInSameModality,
      joinRequests,
      outgoingInvites
    };
  }

  async createClub(userId: number, data: any) {
    const [result] = await db.insert(clubs).values({
      name: data.name,
      tag: data.tag,
      location: data.location,
      logoUrl: data.logoUrl,
      modalityId: data.modalityId,
      presidentId: userId,
    });

    const clubId = result.insertId;

    // Add president as member
    await db.insert(clubMembers).values({
      clubId,
      userId,
      modalityId: data.modalityId,
      role: 'captain', // President is essentially the captain/manager
    });

    return { id: clubId };
  }

  async sendInvite(clubId: number, presidentId: number, data: any) {
    // Check permissions
    const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
    if (!club) throw new NotFoundException('Club not found');
    if (club.presidentId !== presidentId) throw new ForbiddenException('Only president can invite');
    if (!club.modalityId) throw new BadRequestException('Club has no modality assigned');

    // Check if user is already a member
    const existingMember = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, data.targetUserId))
    });
    if (existingMember) throw new BadRequestException('User is already a member');

    // Check if there is already a pending invite
    const existingInvite = await db.query.clubInvitations.findFirst({
      where: and(
        eq(clubInvitations.clubId, clubId),
        eq(clubInvitations.userId, data.targetUserId),
        eq(clubInvitations.status, 'pending')
      )
    });
    if (existingInvite) throw new BadRequestException('An invitation is already pending');

    await db.insert(clubInvitations).values({
      clubId,
      userId: data.targetUserId,
      modalityId: club.modalityId,
      type: 'invite',
      message: data.message,
    });

    return { success: true };
  }

  async requestJoin(clubId: number, userId: number, data: any) {
    const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
    if (!club) throw new NotFoundException('Club not found');
    if (!club.modalityId) throw new BadRequestException('Club has no modality assigned');

    const existingMember = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId))
    });
    if (existingMember) throw new BadRequestException('Already a member');

    const existingReq = await db.query.clubInvitations.findFirst({
      where: and(
        eq(clubInvitations.clubId, clubId),
        eq(clubInvitations.userId, userId),
        eq(clubInvitations.status, 'pending')
      )
    });
    if (existingReq) throw new BadRequestException('Request already pending');

    await db.insert(clubInvitations).values({
      clubId,
      userId,
      modalityId: club.modalityId,
      type: 'request',
      message: data.message,
    });

    return { success: true };
  }

  async respondToInvitation(invitationId: number, userId: number, accept: boolean) {
    const invite = await db.query.clubInvitations.findFirst({ where: eq(clubInvitations.id, invitationId) });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.status !== 'pending') throw new BadRequestException('Invitation is no longer pending');
    if (invite.userId !== userId) throw new ForbiddenException('Not your invitation');
    if (invite.type !== 'invite') throw new BadRequestException('Not an invitation');

    if (accept) {
      await db.insert(clubMembers).values({
        clubId: invite.clubId,
        userId: invite.userId,
        modalityId: invite.modalityId,
        role: 'player',
      });
      await db.insert(transferHistory).values({
        clubId: invite.clubId,
        userId: invite.userId,
        modalityId: invite.modalityId,
        type: 'join',
      });
      await db.update(clubInvitations).set({ status: 'accepted' }).where(eq(clubInvitations.id, invitationId));
      return { success: true, clubId: invite.clubId };
    } else {
      await db.update(clubInvitations).set({ status: 'rejected' }).where(eq(clubInvitations.id, invitationId));
      return { success: true };
    }
  }

  async respondToJoinRequest(invitationId: number, presidentId: number, accept: boolean) {
    const request = await db.query.clubInvitations.findFirst({
      where: eq(clubInvitations.id, invitationId),
      with: { club: true }
    });
    
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'pending') throw new BadRequestException('Request is no longer pending');
    if (request.type !== 'request') throw new BadRequestException('Not a join request');
    
    // Authorization
    if (request.club.presidentId !== presidentId) {
      throw new ForbiddenException('Only president can respond to requests');
    }

    if (accept) {
      await db.insert(clubMembers).values({
        clubId: request.clubId,
        userId: request.userId,
        modalityId: request.modalityId,
        role: 'player',
      });
      await db.insert(transferHistory).values({
        clubId: request.clubId,
        userId: request.userId,
        modalityId: request.modalityId,
        type: 'join',
      });
      await db.update(clubInvitations).set({ status: 'accepted' }).where(eq(clubInvitations.id, invitationId));
      return { success: true, clubId: request.clubId };
    } else {
      await db.update(clubInvitations).set({ status: 'rejected' }).where(eq(clubInvitations.id, invitationId));
      return { success: true };
    }
  }

  async dismissMember(clubId: number, memberId: number, presidentId: number) {
    const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
    if (!club || club.presidentId !== presidentId) throw new ForbiddenException('Only president can dismiss members');

    const member = await db.query.clubMembers.findFirst({ where: eq(clubMembers.id, memberId) });
    if (!member || member.clubId !== clubId) throw new NotFoundException('Member not found');

    if (member.userId === presidentId) throw new BadRequestException('President cannot dismiss themselves');

    await db.delete(clubMembers).where(eq(clubMembers.id, memberId));
    await db.insert(transferHistory).values({
      clubId,
      userId: member.userId,
      modalityId: member.modalityId,
      type: 'kicked',
    });
    return { success: true };
  }

  async leaveClub(clubId: number, userId: number) {
    const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
    if (club && club.presidentId === userId) {
      throw new BadRequestException('President cannot leave the club. Transfer presidency or delete the club.');
    }

    const member = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId))
    });
    if (!member) return { success: true };

    await db.delete(clubMembers).where(
      and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId))
    );
    await db.insert(transferHistory).values({
      clubId,
      userId,
      modalityId: member.modalityId,
      type: 'leave',
    });
    return { success: true };
  }
}
