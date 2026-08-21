import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '../db';
import { competitions, competitionRegistrations, organizations, clubMembers, matches, users, modalities, competitionRosters, competitionPosts, matchEvents, matchScreenshots, matchPlayerStats } from '../db/schema';
import { eq, and, or, inArray, sql } from 'drizzle-orm';

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

    registrations.forEach((reg: any) => {
      standingsMap.set(reg.id, {
        registrationId: reg.id,
        clubId: reg.club.id,
        name: reg.club.name,
        tag: reg.club.tag || 'ATH',
        image: reg.club.image,
        groupId: reg.groupId || 1,
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
            },
            screenshotRequirements: true
          }
        },
        homeRegistration: { 
          with: { 
            club: true,
            roster: { with: { user: true } }
          } 
        },
        awayRegistration: { 
          with: { 
            club: true,
            roster: { with: { user: true } }
          } 
        },
        events: {
          with: {
            player: { columns: { id: true, name: true, nickname: true, image: true } },
            registration: { with: { club: true } }
          }
        },
        screenshots: true
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

  async updateRegistrationStatus(compId: number, regId: number, status: 'approved' | 'rejected') {
    await db.update(competitionRegistrations)
      .set({ status })
      .where(
        and(
          eq(competitionRegistrations.id, regId),
          eq(competitionRegistrations.competitionId, compId)
        )
      );
    return { success: true    }
  }

  async generateKnockoutFromGroups(compId: number) {
    const comp = await db.query.competitions.findFirst({
      where: eq(competitions.id, compId)
    });
    if (!comp) throw new NotFoundException('Competition not found');
    if (comp.format !== 'groups_knockout') throw new Error('Invalid format');

    const matchesInDb = await db.query.matches.findMany({
      where: eq(matches.competitionId, compId)
    });

    const groupsMatches = matchesInDb.filter(m => m.stage === 'groups');
    if (groupsMatches.length === 0) throw new Error('No group matches found');
    if (groupsMatches.some(m => m.status !== 'finished')) {
      throw new Error('All group matches must be finished');
    }

    const knockoutMatches = matchesInDb.filter(m => m.stage === 'knockout');
    if (knockoutMatches.length > 0) throw new Error('Knockout already generated');

    // Get standings
    const details = await this.getDashboardDetails(compId);
    const standings = details.allStandings;

    const advancedTeamsPerGroup = (comp.groupsConfig as any)?.advancedTeamsPerGroup || 2;
    const groupsCount = (comp.groupsConfig as any)?.groupsCount || 2;

    const advancedTeams = [];
    
    // Group standings by groupId
    const standingsByGroup = new Map<number, any[]>();
    standings.forEach((s: any) => {
      const gId = parseInt(s.groupId) || 1;
      if (!standingsByGroup.has(gId)) standingsByGroup.set(gId, []);
      standingsByGroup.get(gId)!.push(s);
    });

    // We want to alternate: 1st of A, 2nd of B, 1st of C, 2nd of D...
    // Actually, user said: "primeiro do A contra o menor do B... assim com C e D"
    // To make a perfect bracket algorithmically without hardcoding groups, 
    // we collect all Nth places.
    const allPlaces = []; // Array of arrays: all 1st places, all 2nd places, etc.
    for (let place = 0; place < advancedTeamsPerGroup; place++) {
      const placeTeams = [];
      for (const [gId, groupStandings] of standingsByGroup.entries()) {
        if (groupStandings[place]) {
          placeTeams.push(groupStandings[place]);
        }
      }
      allPlaces.push(placeTeams);
    }

    // Distribute them into a linear array to feed into the knockout seeder
    // The knockout seeder (1 vs N, 2 vs N-1) works best if the array is ordered from strongest to weakest.
    // So we just push all 1st places, then all 2nd places, etc.
    // Then generateKnockoutBracket will pair index 0 (1st best) with index N-1 (worst).
    for (const placeTeams of allPlaces) {
      // Shuffle within the same place slightly to avoid predictable group A always being seed 1? 
      // User said "sorteio se for impar". For now let's just use them as they are ordered by group.
      advancedTeams.push(...placeTeams);
    }

    // Now convert standings objects back to "team" objects expected by generateKnockoutBracket (which needs `.id` as registrationId)
    const teamsToAdvance = advancedTeams.map(s => ({
      id: s.registrationId,
      club: { id: s.clubId, name: s.name }
    }));

    await this.generateKnockoutBracket(compId, teamsToAdvance);
    return { success: true };
  }

  // --- PHASE 4: MATCH VALIDATION ---

  async generateMatches(compId: number) {
    const comp = await db.query.competitions.findFirst({
      where: eq(competitions.id, compId),
    });
    if (!comp) throw new NotFoundException('Competition not found');

    const approvedRegs = await db.select().from(competitionRegistrations)
      .where(and(eq(competitionRegistrations.competitionId, compId), eq(competitionRegistrations.status, 'approved')));
      
    const pendingRegs = await db.select().from(competitionRegistrations)
      .where(and(eq(competitionRegistrations.competitionId, compId), eq(competitionRegistrations.status, 'pending')));

    if (pendingRegs.length > 0) {
      throw new Error('Não é possível gerar a tabela enquanto houver inscrições pendentes.');
    }
    
    if (approvedRegs.length < 2) {
      throw new Error('Not enough approved teams to generate matches');
    }

    if (comp.format === 'league') {
      await this.generateRoundRobin(compId, approvedRegs, 'regular');
    } else if (comp.format === 'groups_knockout') {
      // 1. Determine groups count
      const groupsCount = (comp.groupsConfig as any)?.groupsCount || 2;
      const groupNames = Array.from({ length: groupsCount }, (_, i) => i + 1);
      
      // 2. Shuffle teams for random drawing
      const shuffledTeams = [...approvedRegs].sort(() => Math.random() - 0.5);
      
      // 3. Distribute teams into groups and update DB
      const groupsMap = new Map<number, any[]>();
      groupNames.forEach(g => groupsMap.set(g, []));

      for (let i = 0; i < shuffledTeams.length; i++) {
        const team = shuffledTeams[i];
        const groupId = groupNames[i % groupsCount];
        groupsMap.get(groupId)!.push(team);
        
        // Persist groupId
        await db.update(competitionRegistrations)
          .set({ groupId: groupId.toString() })
          .where(eq(competitionRegistrations.id, team.id));
      }

      // 4. Generate round-robin for each group
      for (const [groupId, groupTeams] of groupsMap.entries()) {
        await this.generateRoundRobin(compId, groupTeams, 'groups');
      }
    } else {
      // Generate Knockout bracket
      await this.generateKnockoutBracket(compId, approvedRegs);
    }

    // Change status to active
    await db.update(competitions).set({ status: 'active' }).where(eq(competitions.id, compId));
    return { success: true };
  }

  private async generateRoundRobin(compId: number, teams: any[], stage: string = 'regular') {
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
            stage
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

  private async generateKnockoutBracket(compId: number, teams: any[]) {
    // 1. Determine size N (next power of 2)
    let N = 2;
    while (N < teams.length) {
      N *= 2;
    }

    // 2. Generate seeding
    let bracket = [1, 2];
    while (bracket.length < N) {
      const nextBracket = [];
      const sum = bracket.length * 2 + 1;
      for (const seed of bracket) {
        nextBracket.push(seed);
        nextBracket.push(sum - seed);
      }
      bracket = nextBracket;
    }

    // 3. Map teams to seeds (1 to teams.length)
    // Here we could order them by some rating or random. We'll just use the array order.
    const teamMap = new Map();
    teams.forEach((t, index) => {
      teamMap.set(index + 1, t);
    });

    const matchesToInsert = [];

    // The leaves are the first round matches. There are N/2 matches.
    // They correspond to nodes N/2 to N - 1.
    const numRounds = Math.log2(N);
    
    // We create matches from Node 1 (Final) up to N-1
    for (let node = 1; node < N; node++) {
      const roundNum = numRounds - Math.floor(Math.log2(node)); // Final is round 1? No, usually Final is highest round. Let's make Final = numRounds.
      
      const matchObj: any = {
        competitionId: compId,
        status: 'scheduled',
        round: roundNum,
        stage: 'knockout',
        metadata: { bracketNode: node }
      };

      // If it's a leaf node (node >= N/2)
      if (node >= N / 2) {
        const leafIndex = node - N / 2; // 0 to N/2 - 1
        const seed1 = bracket[leafIndex * 2];
        const seed2 = bracket[leafIndex * 2 + 1];
        
        const homeTeam = teamMap.get(seed1);
        const awayTeam = teamMap.get(seed2);

        matchObj.homeRegistrationId = homeTeam ? homeTeam.id : null;
        matchObj.awayRegistrationId = awayTeam ? awayTeam.id : null;

        // If one of the teams is null, it's a BYE. The present team auto-advances.
        // We will mark the match as finished and push the winner to the parent later, or we just leave it to be updated?
        // Let's just create the match. A separate script or the engine will advance BYEs immediately.
        if (!homeTeam || !awayTeam) {
          matchObj.status = 'finished';
          matchObj.isValidated = true;
          matchObj.metadata.isBye = true;
          matchObj.homeScore = homeTeam ? 1 : 0;
          matchObj.awayScore = awayTeam ? 1 : 0;
        }
      }

      matchesToInsert.push(matchObj);
    }

    if (matchesToInsert.length > 0) {
      const inserted = await db.insert(matches).values(matchesToInsert);
      const startId = (inserted as any).insertId;

      // Fetch all matches we just inserted to resolve BYEs
      const allMatches = await db.select().from(matches)
        .where(and(eq(matches.competitionId, compId), eq(matches.stage, 'knockout')));

      // Auto-advance BYEs to parent nodes
      const byes = allMatches.filter(m => (m.metadata as any)?.isBye);
      for (const byeMatch of byes) {
        const parentNode = Math.floor((byeMatch.metadata as any).bracketNode / 2);
        if (parentNode > 0) {
          const parentMatch = allMatches.find(m => (m.metadata as any)?.bracketNode === parentNode);
          if (parentMatch) {
            const isLeftChild = (byeMatch.metadata as any).bracketNode % 2 === 0;
            const winnerId = (byeMatch.homeScore || 0) > (byeMatch.awayScore || 0) ? byeMatch.homeRegistrationId : byeMatch.awayRegistrationId;
            
            await db.update(matches)
              .set({
                [isLeftChild ? 'homeRegistrationId' : 'awayRegistrationId']: winnerId
              })
              .where(eq(matches.id, parentMatch.id));
          }
        }
      }
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
      registrationId: parseInt(dto.registrationId),
      playerId: parseInt(dto.playerId),
      type: dto.type, // 'goal', 'yellow_card', 'red_card'
      minute: dto.minute ? parseInt(dto.minute) : 0,
      metadata: { description: dto.description }
    });
    return { success: true };
  }

  async submitMatchReport(compId: number, matchId: number, uploaderId: number, dto: any) {
    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.competitionId, compId)),
      with: {
        homeRegistration: { with: { club: true } },
        awayRegistration: { with: { club: true } }
      }
    });

    if (!match) throw new NotFoundException('Match not found');

    const isHome = match.homeRegistration?.club?.presidentId === uploaderId;
    const isAway = match.awayRegistration?.club?.presidentId === uploaderId;
    
    if (!isHome && !isAway) {
      throw new ForbiddenException('Apenas os managers dos times podem enviar a súmula.');
    }

    // Process screenshots from dto
    const requirementsMap = new Map<number, string>();
    for (const [key, value] of Object.entries(dto)) {
      if (key.startsWith('req_media_') && value) {
        const reqId = parseInt(key.replace('req_media_', ''));
        if (!isNaN(reqId)) requirementsMap.set(reqId, value as string);
      }
    }

    for (const [reqId, url] of requirementsMap.entries()) {
      await db.insert(matchScreenshots).values({
        matchId,
        requirementId: reqId,
        registrationId: isHome ? match.homeRegistrationId! : match.awayRegistrationId!,
        mediaUrl: url,
        status: 'pending'
      });
    }

    // Save to metadata
    const metadata = (match.metadata as any) || {};
    const submissionData = {
      homeScore: Number(dto.homeScore || 0),
      awayScore: Number(dto.awayScore || 0),
      submittedAt: new Date().toISOString()
    };

    if (isHome) metadata.homeSubmission = submissionData;
    if (isAway) metadata.awaySubmission = submissionData;

    let nextStatus = match.submissionStatus;
    if (match.submissionStatus === 'pending') {
      nextStatus = isHome ? 'submitted_by_home' : 'submitted_by_away';
    } else if (match.submissionStatus === 'submitted_by_home' && isAway) {
      // If away is submitting after home, we should ideally auto-validate if scores match.
      // But the flow is "Capitão A envia, B valida". So if B submits his own, they might conflict.
      if (metadata.homeSubmission?.homeScore === submissionData.homeScore && 
          metadata.homeSubmission?.awayScore === submissionData.awayScore) {
         nextStatus = 'validated';
      } else {
         nextStatus = 'disputed';
      }
    } else if (match.submissionStatus === 'submitted_by_away' && isHome) {
      if (metadata.awaySubmission?.homeScore === submissionData.homeScore && 
          metadata.awaySubmission?.awayScore === submissionData.awayScore) {
         nextStatus = 'validated';
      } else {
         nextStatus = 'disputed';
      }
    }

    // Update match
    const updateData: any = {
      metadata,
      submissionStatus: nextStatus,
    };
    
    // Se o status da partida ainda for live, já passamos pra pending_validation ou finished dependendo do nextStatus
    if (match.status === 'live' || match.status === 'scheduled') {
        updateData.status = nextStatus === 'validated' ? 'finished' : 'pending_validation';
    }

    if (nextStatus === 'validated') {
      updateData.homeScore = submissionData.homeScore;
      updateData.awayScore = submissionData.awayScore;
      updateData.isValidated = true;
      updateData.status = 'finished';
    }

    await db.update(matches)
      .set(updateData)
      .where(eq(matches.id, matchId));

    if (nextStatus === 'validated' && match.stage === 'knockout') {
        await this.advanceKnockoutWinner(compId, matchId, updateData.homeScore, updateData.awayScore);
    }

    return { success: true };
  }

  // Extracted logic to advance winner
  private async advanceKnockoutWinner(compId: number, matchId: number, homeScore: number, awayScore: number) {
      const finishedMatch = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
      if (!finishedMatch) return;
      const metadata = finishedMatch.metadata as any;
      if (metadata && metadata.bracketNode) {
          const parentNode = Math.floor(metadata.bracketNode / 2);
          if (parentNode > 0) {
            let targetMatch = await db.query.matches.findFirst({
              where: and(eq(matches.competitionId, compId), eq(matches.stage, 'knockout'), sql`JSON_EXTRACT(metadata, '$.bracketNode') = ${parentNode}`)
            });
            if (!targetMatch) {
               const allKnockoutMatches = await db.select().from(matches).where(and(eq(matches.competitionId, compId), eq(matches.stage, 'knockout')));
               targetMatch = allKnockoutMatches.find(m => (m.metadata as any)?.bracketNode === parentNode);
            }
            if (targetMatch) {
              const isLeftChild = metadata.bracketNode % 2 === 0;
              const winnerId = homeScore > awayScore ? finishedMatch.homeRegistrationId : finishedMatch.awayRegistrationId;
              await db.update(matches)
                .set({ [isLeftChild ? 'homeRegistrationId' : 'awayRegistrationId']: winnerId })
                .where(eq(matches.id, targetMatch.id));
            }
          }
      }
  }

  async validateMatch(compId: number, matchId: number, dto: any) {
    // action: 'accept' or 'dispute' or 'force_validate'
    const match = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
    if (!match) throw new NotFoundException('Match not found');

    if (dto.action === 'accept') {
      const homeScore = Number(dto.homeScore || 0);
      const awayScore = Number(dto.awayScore || 0);

      await db.update(matches)
        .set({ 
          status: 'finished', 
          submissionStatus: 'validated',
          homeScore, 
          awayScore, 
          isValidated: true 
        })
        .where(eq(matches.id, matchId));
      
      await db.update(matchScreenshots)
        .set({ status: 'validated' })
        .where(eq(matchScreenshots.matchId, matchId));

      if (match.stage === 'knockout') {
        await this.advanceKnockoutWinner(compId, matchId, homeScore, awayScore);
      }
    } else if (dto.action === 'force_validate') {
      const homeScore = Number(dto.homeScore || 0);
      const awayScore = Number(dto.awayScore || 0);
      
      await db.update(matches)
        .set({ 
          status: 'finished', 
          submissionStatus: 'validated',
          homeScore, 
          awayScore, 
          isValidated: true 
        })
        .where(eq(matches.id, matchId));
        
      if (match.stage === 'knockout') {
        await this.advanceKnockoutWinner(compId, matchId, homeScore, awayScore);
      }
    } else if (dto.action === 'dispute') {
       await db.update(matches)
        .set({ submissionStatus: 'disputed' })
        .where(eq(matches.id, matchId));
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
