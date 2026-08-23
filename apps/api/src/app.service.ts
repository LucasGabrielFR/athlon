import { Injectable } from '@nestjs/common';
import { db } from './db';
import { modalities, clubs, competitions, matches } from './db/schema';
import { sql } from 'drizzle-orm';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Athlon API is running! 🚀';
  }

  async getOverviewStats() {
    const [modalityCount] = await db.select({ count: sql<number>`count(*)` }).from(modalities);
    const [clubCount] = await db.select({ count: sql<number>`count(*)` }).from(clubs);
    const [competitionCount] = await db.select({ count: sql<number>`count(*)` }).from(competitions);
    const [matchCount] = await db.select({ count: sql<number>`count(*)` }).from(matches);

    return {
      modalities: Number(modalityCount.count),
      clubs: Number(clubCount.count),
      competitions: Number(competitionCount.count),
      matches: Number(matchCount.count),
    };
  }
}
