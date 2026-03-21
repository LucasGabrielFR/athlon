import { db } from '../src/db';
import { users, clubs, clubMembers, modalities, organizations, competitions, competitionRegistrations, competitionRosters } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function seedKnockout() {
  console.log('🚀 Starting knockout seed...');

  // Fetch all active modalities
  const allMods = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
    with: { positions: true },
  });

  if (allMods.length === 0) {
    console.error('❌ No active modalities found. Please use standard seed first.');
    process.exit(1);
  }

  const footballMod = allMods.find(m => m.name.toLowerCase().includes('futebol')) || allMods[0];

  // Org
  const orgName = 'Federação de Teste Athlon';
  const existingOrg = await db.query.organizations.findFirst({ where: eq(organizations.name, orgName) });
  
  if (!existingOrg) {
    console.error('❌ Run npm run db:seed first to have the organization.');
    process.exit(1);
  }

  // Competition
  console.log('🎮 Creating Knockout Test Competition...');
  const compName = 'Copa Athlon Mata-Mata Perfeita 2026';
  let compId: number;
  const existingComp = await db.query.competitions.findFirst({ where: eq(competitions.name, compName) });

  if (existingComp) {
    compId = existingComp.id;
    // reset status and matches
    await db.update(competitions).set({ status: 'registration', format: 'knockout' }).where(eq(competitions.id, compId));
  } else {
    const [res]: any = await db.insert(competitions).values({
      name: compName,
      modalityId: footballMod.id,
      organizationId: existingOrg.id,
      format: 'knockout',
      knockoutConfig: { matchupFormat: 'single', tieBreaker: 'penalties' },
      status: 'registration',
      maxTeams: 8,
      minPlayersPerTeam: 1,
      maxPlayersPerTeam: 15,
      startDate: new Date('2026-06-01'),
    });
    compId = res.insertId;
  }

  // Register Clubs
  console.log('📝 Registering clubs...');
  const allClubs = await db.query.clubs.findMany({ 
    where: eq(clubs.modalityId, footballMod.id),
    limit: 8 // Generate exactly 8 to test a perfect bracket!
  });

  for (const club of allClubs) {
    let regId: number;
    const existingReg = await db.query.competitionRegistrations.findFirst({
      where: and(
        eq(competitionRegistrations.competitionId, compId),
        eq(competitionRegistrations.clubId, club.id)
      )
    });

    if (existingReg) {
      regId = existingReg.id;
      await db.update(competitionRegistrations).set({ status: 'approved' }).where(eq(competitionRegistrations.id, regId));
    } else {
      const [res]: any = await db.insert(competitionRegistrations).values({
        competitionId: compId,
        clubId: club.id,
        status: 'approved',
      });
      regId = res.insertId;
    }

    // Populate Roster
    const members = await db.query.clubMembers.findMany({
      where: eq(clubMembers.clubId, club.id)
    });

    for (const member of members) {
      await db.insert(competitionRosters).values({
        registrationId: regId,
        userId: member.userId,
      }).catch(() => {}); // ignore duplicates
    }
    console.log(`✅ Registered ${club.name}`);
  }

  console.log('✅ Knockout seed finished successfully! You can go to the Competition dashboard and hit "Start Tournament".');
  process.exit(0);
}

seedKnockout().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
