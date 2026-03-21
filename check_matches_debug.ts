import { db } from './src/db';
import { matches, competitions } from './src/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

async function check() {
  const latestComp = await db.query.competitions.findFirst({
    orderBy: [desc(competitions.id)]
  });
  if (!latestComp) process.exit(0);
  console.log(`Comp: ${latestComp.name} (${latestComp.id}) - Format: ${latestComp.format}`);
  
  const allMatches = await db.query.matches.findMany({
    where: eq(matches.competitionId, latestComp.id),
    orderBy: [asc(matches.id)]
  });

  allMatches.forEach(m => {
    console.log(`Match ${m.id} - Round ${m.round} - Index of round matches?`);
  });
  
  // Logic from updateMatchStatusAction
  const round1 = allMatches.filter(m => m.round === 1).sort((a,b) => a.id - b.id);
  const round2 = allMatches.filter(m => m.round === 2).sort((a,b) => a.id - b.id);
  
  console.log('--- ROUND 1 ---');
  round1.forEach((m, idx) => console.log(`Idx ${idx}: Match ${m.id} -> should go to Round 2 Match ${Math.floor(idx/2)} ${idx%2===0?'Home':'Away'} - Current Result: ${m.homeScore}-${m.awayScore} Winner Reg ID?`));
  
  console.log('--- ROUND 2 ---');
  round2.forEach((m, idx) => console.log(`Idx ${idx}: Match ${m.id} - Current Home Reg: ${m.homeRegistrationId} Away Reg: ${m.awayRegistrationId}`));

  process.exit(0);
}
check();
