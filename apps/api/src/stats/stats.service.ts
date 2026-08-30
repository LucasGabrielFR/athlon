import { Injectable, UnauthorizedException } from '@nestjs/common';
import { db } from '../db';
import { 
  modalities, clubs, competitions, matches, users, organizations, 
  clubMembers, matchPlayerStats, competitionRegistrations 
} from '../db/schema';
import { eq, sql, desc, and, or, inArray, count, countDistinct } from 'drizzle-orm';

@Injectable()
export class StatsService {
  async getDashboardData(userId: number, role: string) {
    if (role === 'admin') {
      return { type: 'admin', data: await this.getAdminDashboard() };
    } else if (role === 'org_president') {
      return { type: 'org_president', data: await this.getOrgPresidentDashboard(userId) };
    } else if (role === 'club_president') {
      return { type: 'club_president', data: await this.getClubPresidentDashboard(userId) };
    } else {
      // Default to player
      return { type: 'player', data: await this.getPlayerDashboard(userId) };
    }
  }

  private async getAdminDashboard() {
    const [modalityCount] = await db.select({ count: sql<number>`count(*)` }).from(modalities);
    const [clubCount] = await db.select({ count: sql<number>`count(*)` }).from(clubs);
    const [competitionCount] = await db.select({ count: sql<number>`count(*)` }).from(competitions);
    const [matchCount] = await db.select({ count: sql<number>`count(*)` }).from(matches);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [orgCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations);

    const topModalities = await db.select({
      id: modalities.id,
      name: modalities.name,
      matchCount: sql<number>`count(${matches.id})`
    })
    .from(modalities)
    .leftJoin(competitions, eq(competitions.modalityId, modalities.id))
    .leftJoin(matches, eq(matches.competitionId, competitions.id))
    .groupBy(modalities.id)
    .orderBy(desc(sql`count(${matches.id})`))
    .limit(5);

    return {
      overview: {
        modalities: Number(modalityCount.count),
        clubs: Number(clubCount.count),
        competitions: Number(competitionCount.count),
        matches: Number(matchCount.count),
        users: Number(userCount.count),
        organizations: Number(orgCount.count),
      },
      topModalities: topModalities.map(m => ({ ...m, matchCount: Number(m.matchCount) }))
    };
  }

  public async getPlayerDashboard(userId: number) {
    const myClubs = await db.query.clubMembers.findMany({
      where: eq(clubMembers.userId, userId),
      with: { club: true, modality: true }
    });

    const statsPerModality = await db.select({
      modalityId: competitions.modalityId,
      modalityName: modalities.name,
      matchesPlayed: sql<number>`count(distinct ${matches.id})`,
      totalGoals: sql<number>`sum(${matchPlayerStats.goals})`,
      totalAssists: sql<number>`sum(${matchPlayerStats.assists})`,
    })
    .from(matchPlayerStats)
    .innerJoin(matches, eq(matches.id, matchPlayerStats.matchId))
    .innerJoin(competitions, eq(competitions.id, matches.competitionId))
    .innerJoin(modalities, eq(modalities.id, competitions.modalityId))
    .where(eq(matchPlayerStats.playerId, userId))
    .groupBy(competitions.modalityId, modalities.name);

    const recentMatches = await db.select({
      id: matches.id,
      status: matches.status,
      startTime: matches.startTime,
      competitionName: competitions.name,
      modalityName: modalities.name,
      goals: matchPlayerStats.goals,
      assists: matchPlayerStats.assists,
      rating: matchPlayerStats.rating
    })
    .from(matchPlayerStats)
    .innerJoin(matches, eq(matches.id, matchPlayerStats.matchId))
    .innerJoin(competitions, eq(competitions.id, matches.competitionId))
    .innerJoin(modalities, eq(modalities.id, competitions.modalityId))
    .where(eq(matchPlayerStats.playerId, userId))
    .orderBy(desc(matches.startTime))
    .limit(10);

    // Advanced Radar Stats
    const [globalStats] = await db.select({
      matchesPlayed: sql<number>`count(${matches.id})`,
      totalGoals: sql<number>`sum(${matchPlayerStats.goals})`,
      totalAssists: sql<number>`sum(${matchPlayerStats.assists})`,
      avgRating: sql<number>`avg(${matchPlayerStats.rating})`,
      wins: sql<number>`sum(case 
        when ${matchPlayerStats.registrationId} = ${matches.homeRegistrationId} and ${matches.homeScore} > ${matches.awayScore} then 1 
        when ${matchPlayerStats.registrationId} = ${matches.awayRegistrationId} and ${matches.awayScore} > ${matches.homeScore} then 1 
        else 0 end)`
    })
    .from(matchPlayerStats)
    .innerJoin(matches, eq(matches.id, matchPlayerStats.matchId))
    .where(eq(matchPlayerStats.playerId, userId));

    const mPlayed = Number(globalStats?.matchesPlayed || 0);
    const radarStats = [
      { subject: 'Gols', value: Math.min((Number(globalStats?.totalGoals || 0) / (mPlayed || 1)) * 100, 100), fullMark: 100 },
      { subject: 'Assists', value: Math.min((Number(globalStats?.totalAssists || 0) / (mPlayed || 1)) * 100, 100), fullMark: 100 },
      { subject: 'Nota Média', value: Number(globalStats?.avgRating || 0) * 10, fullMark: 100 },
      { subject: 'Participação', value: Math.min(mPlayed * 5, 100), fullMark: 100 },
      { subject: 'Vitórias', value: mPlayed > 0 ? (Number(globalStats?.wins || 0) / mPlayed) * 100 : 0, fullMark: 100 },
    ];

    return {
      clubs: myClubs,
      statsPerModality: statsPerModality.map(s => ({
        ...s, 
        matchesPlayed: Number(s.matchesPlayed),
        totalGoals: Number(s.totalGoals || 0),
        totalAssists: Number(s.totalAssists || 0)
      })),
      recentMatches,
      radarStats
    };
  }

  private async getClubPresidentDashboard(userId: number) {
    const presidedClubs = await db.query.clubs.findMany({
      where: eq(clubs.presidentId, userId),
      with: { modality: true }
    });

    const clubIds = presidedClubs.map(c => c.id);
    let clubStats: any[] = [];
    
    if (clubIds.length > 0) {
      // We will loop over each club to get detailed stats
      for (const club of presidedClubs) {
        // Matches for this club
        const matchesData = await db.select({
          id: matches.id,
          homeRegId: matches.homeRegistrationId,
          awayRegId: matches.awayRegistrationId,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
          regId: competitionRegistrations.id
        })
        .from(matches)
        .innerJoin(competitionRegistrations, or(
          eq(competitionRegistrations.id, matches.homeRegistrationId),
          eq(competitionRegistrations.id, matches.awayRegistrationId)
        ))
        .where(eq(competitionRegistrations.clubId, club.id))
        .orderBy(desc(matches.startTime));

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let form: string[] = [];

        for (let i = 0; i < matchesData.length; i++) {
          const m = matchesData[i];
          const isHome = m.regId === m.homeRegId;
          const myScore = isHome ? m.homeScore : m.awayScore;
          const opScore = isHome ? m.awayScore : m.homeScore;

          const my = myScore || 0;
          const op = opScore || 0;
          
          let result = 'D';
          if (my > op) { wins++; result = 'W'; }
          else if (my === op) { draws++; result = 'D'; }
          else { losses++; result = 'L'; }

          if (i < 5) form.unshift(result); // latest matches first, we unshift to get oldest of the 5 first in array
        }

        // Top scorers for the club
        const topScorersData = await db.select({
          playerId: matchPlayerStats.playerId,
          playerName: users.name,
          goals: sql<number>`sum(${matchPlayerStats.goals})`
        })
        .from(matchPlayerStats)
        .innerJoin(users, eq(users.id, matchPlayerStats.playerId))
        .innerJoin(competitionRegistrations, eq(competitionRegistrations.id, matchPlayerStats.registrationId))
        .where(eq(competitionRegistrations.clubId, club.id))
        .groupBy(matchPlayerStats.playerId, users.name)
        .orderBy(desc(sql`sum(${matchPlayerStats.goals})`))
        .limit(3);

        clubStats.push({
          clubId: club.id,
          clubName: club.name,
          matchesPlayed: matchesData.length,
          wins,
          draws,
          losses,
          form,
          topScorers: topScorersData.map(ts => ({ ...ts, goals: Number(ts.goals) }))
        });
      }
    }

    const playerData = await this.getPlayerDashboard(userId);

    return {
      presidedClubs,
      clubStats,
      playerData
    };
  }

  private async getOrgPresidentDashboard(userId: number) {
    const orgs = await db.query.organizations.findMany({
      where: eq(organizations.presidentId, userId)
    });

    const orgIds = orgs.map(o => o.id);
    let activeComps = 0;
    let finishedComps = 0;
    let uniqueClubs = 0;

    if (orgIds.length > 0) {
      const [compsInfo] = await db.select({
        active: sql<number>`sum(case when ${competitions.status} = 'active' then 1 else 0 end)`,
        finished: sql<number>`sum(case when ${competitions.status} = 'finished' then 1 else 0 end)`,
      })
      .from(competitions)
      .where(inArray(competitions.organizationId, orgIds));

      activeComps = Number(compsInfo?.active || 0);
      finishedComps = Number(compsInfo?.finished || 0);

      const [clubInfo] = await db.select({
        count: countDistinct(competitionRegistrations.clubId)
      })
      .from(competitionRegistrations)
      .innerJoin(competitions, eq(competitions.id, competitionRegistrations.competitionId))
      .where(inArray(competitions.organizationId, orgIds));

      uniqueClubs = Number(clubInfo?.count || 0);
    }

    return {
      organizations: orgs,
      activeCompetitions: activeComps,
      finishedCompetitions: finishedComps,
      totalClubsParticipated: uniqueClubs
    };
  }
}
