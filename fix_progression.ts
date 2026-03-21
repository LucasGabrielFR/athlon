import { db } from './src/db';
import { matches, competitions } from './src/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

async function fix() {
  const latestComp = await db.query.competitions.findFirst({
    orderBy: [desc(competitions.id)]
  });
  if (!latestComp) process.exit(0);
  
  // 1. Fix Null Scores
  await db.update(matches)
    .set({ homeScore: 0 })
    .where(and(eq(matches.competitionId, latestComp.id), eq(matches.homeScore, null as any)));
    
  await db.update(matches)
    .set({ awayScore: 0 })
    .where(and(eq(matches.competitionId, latestComp.id), eq(matches.awayScore, null as any)));

  // 2. Trigger Progression for Finished Matches that haven't advanced yet
  const finished = await db.query.matches.findMany({
    where: and(eq(matches.competitionId, latestComp.id), eq(matches.status, 'finished')),
    orderBy: [asc(matches.id)]
  });

  for (const match of finished) {
    if (match.round && match.homeRegistrationId && match.awayRegistrationId) {
       const h = match.homeScore || 0;
       const a = match.awayScore || 0;
       let winnerId = h > a ? match.homeRegistrationId : (a > h ? match.awayRegistrationId : null);
       
       if (winnerId) {
          const roundMatches = await db.query.matches.findMany({
            where: and(eq(matches.competitionId, match.competitionId), eq(matches.round, match.round)),
            orderBy: [asc(matches.id)]
          });
          const idx = roundMatches.findIndex(m => m.id === match.id);
          const nextRound = match.round + 1;
          const nextIdx = Math.floor(idx / 2);
          const isHome = idx % 2 === 0;
          
          const nextRoundMatches = await db.query.matches.findMany({
            where: and(eq(matches.competitionId, match.competitionId), eq(matches.round, nextRound)),
            orderBy: [asc(matches.id)]
          });

          const nextMatch = nextRoundMatches[nextIdx];
          if (nextMatch) {
             console.log(`Advancing Match ${match.id} winner (${winnerId}) to Match ${nextMatch.id} (${isHome?'Home':'Away'})`);
             await db.update(matches)
               .set(isHome ? { homeRegistrationId: winnerId } : { awayRegistrationId: winnerId })
               .where(eq(matches.id, nextMatch.id));
          }
       }
    }
  }
  process.exit(0);
}
fix();
