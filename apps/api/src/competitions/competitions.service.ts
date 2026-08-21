import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { competitions, competitionRegistrations, organizations, clubMembers, matches, users, modalities, competitionRosters, competitionPosts, matchEvents, matchScreenshots, matchPlayerStats } from '../db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

@Injectable()
export class CompetitionsService {

  async getDashboard(userId: number) {
    // 1. Fetch all competitions
    const all = await db.query.competitions.findMany({
      with: {
        modality: true,
        organization: true,
        registrations: {
          with: {
            club: {
              with: {
                members: true
              }
            }
          }
        }
      }
    });

    const mine: typeof all = [];
    const others: typeof all = [];

    // 2. Separate into mine and others
    all.forEach(comp => {
      let isMine = false;
      
      // I own the organization
      if (comp.organization?.presidentId === userId) {
        isMine = true;
      }
      
      // Or I'm a member of a club enrolled in this competition
      if (!isMine) {
        const myClubsEnrolled = comp.registrations.some(reg => 
          reg.club?.members?.some(m => m.userId === userId)
        );
        if (myClubsEnrolled) isMine = true;
      }

      // Remove heavy nested relations before sending to frontend
      const compCleaned = {
        ...comp,
        registrations: comp.registrations.map(r => ({ id: r.id, clubId: r.clubId, status: r.status }))
      };

      if (isMine) {
        mine.push(compCleaned as any);
      } else {
        others.push(compCleaned as any);
      }
    });

    return { all, mine, others };
  }

  async getNewFormData(userId: number) {
    // Return user (mock simple), modalities, and organizations owned by user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const allModalities = await db.query.modalities.findMany({
      where: eq(modalities.isActive, true)
    });

    const myOrganizations = await db.query.organizations.findMany({
      where: eq(organizations.presidentId, userId)
    });

    return {
      user,
      modalities: allModalities,
      organizations: myOrganizations
    };
  }

  async getDashboardDetails(compId: number) {
    const comp = await db.query.competitions.findFirst({
      where: eq(competitions.id, compId),
      with: {
        modality: true,
        organization: true,
        organizer: {
          columns: { id: true, name: true, nickname: true, image: true }
        },
        registrations: {
          with: {
            club: true
          }
        },
        screenshotRequirements: true,
        posts: {
          with: {
            author: { columns: { id: true, name: true, nickname: true, image: true } }
          },
          orderBy: (posts, { desc }) => [desc(posts.createdAt)]
        },
        matches: {
          with: {
            homeRegistration: {
              with: { club: true }
            },
            awayRegistration: {
              with: { club: true }
            }
          }
        }
      }
    });

    if (!comp) throw new NotFoundException('Competition not found');

    const ptsWin = (comp.groupsConfig as any)?.pointsPerWin ?? 3;
    const ptsDraw = (comp.groupsConfig as any)?.pointsPerDraw ?? 1;
    const ptsLoss = (comp.groupsConfig as any)?.pointsPerLoss ?? 0;
    
    const compMatches = await db.query.matches.findMany({
      where: and(eq(matches.competitionId, compId), eq(matches.status, 'finished'))
    });

    const standingsMap = new Map();
    const registrations = (comp as any).registrations || [];

    // Determinar grupos
    const groupsCount = comp.format === 'groups_knockout' ? ((comp.groupsConfig as any)?.groupsCount || 2) : 1;
    const groups = Array.from({ length: groupsCount }, (_, i) => i + 1);

    registrations.forEach((reg: any, index: number) => {
      // Simula uma distribuição de grupos (A, B...) baseada no ID para testes
      const groupId = comp.format === 'groups_knockout' ? (index % groupsCount) + 1 : 1;
      
      standingsMap.set(reg.id, {
        registrationId: reg.id,
        clubId: reg.club.id,
        name: reg.club.name,
        tag: reg.club.tag || 'ATH',
        image: reg.club.image,
        groupId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
      });
    });

    for (const match of compMatches) {
      if (!match.homeRegistrationId || !match.awayRegistrationId) continue;
      
      const home = standingsMap.get(match.homeRegistrationId);
      const away = standingsMap.get(match.awayRegistrationId);

      if (home && away) {
        home.played++;
        away.played++;
        home.goalsFor += match.homeScore || 0;
        home.goalsAgainst += match.awayScore || 0;
        away.goalsFor += match.awayScore || 0;
        away.goalsAgainst += match.homeScore || 0;

        if ((match.homeScore || 0) > (match.awayScore || 0)) {
          home.wins++;
          home.points += ptsWin;
          away.losses++;
          away.points += ptsLoss;
        } else if ((match.homeScore || 0) < (match.awayScore || 0)) {
          away.wins++;
          away.points += ptsWin;
          home.losses++;
          home.points += ptsLoss;
        } else {
          home.draws++;
          away.draws++;
          home.points += ptsDraw;
          away.points += ptsDraw;
        }
      }
    }

    const allStandings = Array.from(standingsMap.values()).map(s => {
      s.goalDiff = s.goalsFor - s.goalsAgainst;
      return s;
    });

    const tieBreakerOrder = (comp.groupsConfig as any)?.tieBreakerOrder || ['pts', 'wins', 'goalDiff', 'goalsFor'];

    allStandings.sort((a, b) => {
      for (const criteria of tieBreakerOrder) {
        if (criteria === 'pts' && a.points !== b.points) return b.points - a.points;
        if (criteria === 'wins' && a.wins !== b.wins) return b.wins - a.wins;
        if (criteria === 'goalDiff' && a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
        if (criteria === 'goalsFor' && a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      }
      return 0;
    });

    return {
      competition: comp,
      allRegistrations: registrations,
      posts: (comp as any).posts,
      allStandings,
      groups
    };
  }

  async getRosterDetails(compId: number, registrationId: number) {
    const comp = await db.query.competitions.findFirst({
      where: eq(competitions.id, compId)
    });
    if (!comp) throw new NotFoundException('Competition not found');

    const reg = await db.query.competitionRegistrations.findFirst({
      where: and(
        eq(competitionRegistrations.id, registrationId),
        eq(competitionRegistrations.competitionId, compId)
      ),
      with: {
        club: {
          with: {
            members: {
              with: {
                user: { columns: { id: true, name: true, nickname: true, image: true } }
              }
            }
          }
        },
        roster: {
          with: {
            user: { columns: { id: true, name: true, nickname: true, image: true } }
          }
        }
      }
    });

    if (!reg) throw new NotFoundException('Registration not found');

    return {
      competition: comp,
      registration: reg,
      roster: reg.roster
    };
  }

  async getMatchDetails(compId: number, matchId: number) {
    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.competitionId, compId)),
      with: {
        competition: {
          with: {
            modality: {
              with: {
                statTypes: true
              }
            }
          }
        },
        homeRegistration: { with: { club: true } },
        awayRegistration: { with: { club: true } },
        events: {
          with: {
            player: { columns: { id: true, name: true, nickname: true, image: true } }
          }
        }
      }
    });

    if (!match) throw new NotFoundException('Match not found');

    return { match };
  }

  // === PHASE 2: MUTATIONS ===

  async createCompetition(userId: number, dto: any) {
    const result = await db.insert(competitions).values({
      name: dto.name,
      modalityId: dto.modalityId ? parseInt(dto.modalityId) : null,
      organizationId: dto.organizationId ? parseInt(dto.organizationId) : null,
      organizerId: userId,
      description: dto.description,
      format: dto.format || 'round_robin',
      status: 'planned'
    });
    return { success: true, id: result[0].insertId };
  }

  async registerClub(compId: number, userId: number, dto: any) {
    await db.insert(competitionRegistrations).values({
      competitionId: compId,
      clubId: parseInt(dto.clubId),
      status: 'pending'
    });
    return { success: true };
  }

  async approveRegistration(compId: number, regId: number) {
    await db.update(competitionRegistrations)
      .set({ status: 'approved' })
      .where(and(eq(competitionRegistrations.id, regId), eq(competitionRegistrations.competitionId, compId)));
    return { success: true };
  }

  async addToRoster(compId: number, regId: number, dto: any) {
    await db.insert(competitionRosters).values({
      registrationId: regId,
      userId: parseInt(dto.userId)
    });
    return { success: true };
  }

  async removeFromRoster(compId: number, regId: number, userIdToRemove: number) {
    await db.delete(competitionRosters).where(
      and(
        eq(competitionRosters.registrationId, regId),
        eq(competitionRosters.userId, userIdToRemove)
      )
    );
    return { success: true };
  }

  async createCompetitionPost(compId: number, authorId: number, dto: any) {
    await db.insert(competitionPosts).values({
      competitionId: compId,
      authorId,
      content: dto.content
    });
    return { success: true };
  }

  async deleteCompetitionPost(compId: number, postId: number) {
    await db.delete(competitionPosts).where(
      and(
        eq(competitionPosts.id, postId),
        eq(competitionPosts.competitionId, compId)
      )
    );
    return { success: true };
  }

  // --- PHASE 3: MATCH ENGINE ---

  async generateMatches(compId: number) {
    const comp = await db.query.competitions.findFirst({
      where: eq(competitions.id, compId),
    });
    if (!comp) throw new NotFoundException('Competition not found');

    const approvedRegs = await db.select().from(competitionRegistrations)
      .where(and(eq(competitionRegistrations.competitionId, compId), eq(competitionRegistrations.status, 'approved')));
    
    if (approvedRegs.length < 2) {
      throw new Error('Not enough approved teams to generate matches');
    }

    if (comp.format === 'league') {
      await this.generateRoundRobin(compId, approvedRegs);
    } else {
      // Future: Knockout bracket generation
      throw new Error('Knockout format generation is not yet implemented');
    }

    // Change status to active
    await db.update(competitions).set({ status: 'active' }).where(eq(competitions.id, compId));
    return { success: true };
  }

  private async generateRoundRobin(compId: number, teams: any[]) {
    // Basic Round Robin Algorithm
    let numTeams = teams.length;
    const isOdd = numTeams % 2 !== 0;
    
    // If odd, add a dummy team for "bye"
    const scheduleTeams = [...teams];
    if (isOdd) {
      scheduleTeams.push(null);
      numTeams++;
    }

    const rounds = numTeams - 1;
    const matchesToInsert = [];

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < numTeams / 2; i++) {
        const home = scheduleTeams[i];
        const away = scheduleTeams[numTeams - 1 - i];

        if (home !== null && away !== null) {
          matchesToInsert.push({
            competitionId: compId,
            homeRegistrationId: home.id,
            awayRegistrationId: away.id,
            status: 'scheduled',
            round: r + 1,
            stage: 'regular'
          });
        }
      }
      // Rotate teams (keep index 0 fixed)
      scheduleTeams.splice(1, 0, scheduleTeams.pop()!);
    }

    if (matchesToInsert.length > 0) {
      await db.insert(matches).values(matchesToInsert);
    }
  }

  async updateMatchStatus(compId: number, matchId: number, status: string) {
    await db.update(matches)
      .set({ status })
      .where(and(eq(matches.id, matchId), eq(matches.competitionId, compId)));
    return { success: true };
  }

  async recordMatchEvent(compId: number, matchId: number, dto: any) {
    await db.insert(matchEvents).values({
      matchId,
      registrationId: dto.registrationId,
      playerId: dto.playerId,
      type: dto.type, // 'goal', 'yellow_card', 'red_card'
      minute: dto.minute,
      metadata: { description: dto.description }
    });
    return { success: true };
  }

  async submitMatchReport(compId: number, matchId: number, uploaderId: number, dto: any) {
    // 1. Upload screenshot
    await db.insert(matchScreenshots).values({
      matchId,
      requirementId: dto.requirementId || 1, // Default to 1 if not provided to pass nonNull constraint
      registrationId: dto.registrationId,
      mediaUrl: dto.imageUrl || dto.mediaUrl,
      status: 'pending'
    });
    
    // 2. Change match status to pending_validation if not finished
    await db.update(matches)
      .set({ status: 'pending_validation' })
      .where(and(eq(matches.id, matchId), eq(matches.status, 'live')));

    return { success: true };
  }

  async validateMatch(compId: number, matchId: number, dto: any) {
    // action: 'accept' or 'dispute'
    if (dto.action === 'accept') {
      await db.update(matches)
        .set({ status: 'finished', homeScore: dto.homeScore, awayScore: dto.awayScore })
        .where(eq(matches.id, matchId));
      
      await db.update(matchScreenshots)
        .set({ status: 'validated' })
        .where(eq(matchScreenshots.matchId, matchId));
    } else {
      await db.update(matches)
        .set({ status: 'disputed' })
        .where(eq(matches.id, matchId));
        
      await db.update(matchScreenshots)
        .set({ status: 'rejected' })
        .where(eq(matchScreenshots.matchId, matchId));
    }
    return { success: true };
  }

  async deleteCompetition(compId: number) {
    await db.delete(competitions).where(eq(competitions.id, compId));
    return { success: true };
  }

  async updateCompetitionStatus(compId: number, status: string) {
    await db.update(competitions).set({ status }).where(eq(competitions.id, compId));
    return { success: true };
  }
}
