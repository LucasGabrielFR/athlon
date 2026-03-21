import { db } from './src/db';
import { users, clubs, competitionRegistrations, competitionRosters, modalities, competitions } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function check() {
  const userCount = await db.select({ count: sql`count(*)` }).from(users);
  const clubCount = await db.select({ count: sql`count(*)` }).from(clubs);
  const regCount = await db.select({ count: sql`count(*)` }).from(competitionRegistrations);
  const rosterCount = await db.select({ count: sql`count(*)` }).from(competitionRosters);
  const modData = await db.select().from(modalities);

  console.log('--- Database Audit ---');
  console.log('Users:', userCount[0].count);
  console.log('Clubs:', clubCount[0].count);
  console.log('Registrations:', regCount[0].count);
  const clubsWithMod = await db.select({ id: clubs.id, name: clubs.name, modId: clubs.modalityId }).from(clubs);
  console.log('\n--- Clubs Modality Audit ---');
  clubsWithMod.forEach(c => console.log(`Club: ${c.name} (ID: ${c.id}) -> Modality ID: ${c.modId}`));

  const regs = await db.select().from(competitionRegistrations);
  console.log('\n--- Raw Registrations ---');
  console.log(regs);

  const comps = await db.select().from(competitions);
  console.log('\n--- Competitions ---');
  comps.forEach(c => console.log(`Comp: ${c.name} (ID: ${c.id}) -> Status: ${c.status} -> Mod ID: ${c.modalityId}`));

  process.exit(0);
}

check();
