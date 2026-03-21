import { db } from '../src/db';
import { users, clubs, clubMembers, modalities, positions, playerModalities, organizations, competitions, competitionRegistrations, competitionRosters, statTypes } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';

async function hashPassword(password: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash;
}

const CLUB_NAMES = [
  { name: 'Alpha Esports', tag: 'ALP' },
  { name: 'Bravo Gaming', tag: 'BRV' },
  { name: 'Charlie Squad', tag: 'CHA' },
  { name: 'Delta Warriors', tag: 'DLT' },
  { name: 'Echo Force', tag: 'ECH' },
  { name: 'Foxtrot Elite', tag: 'FOX' },
  { name: 'Golf United', tag: 'GLF' },
  { name: 'Hotel Legends', tag: 'HTL' },
  { name: 'India Kings', tag: 'IND' },
  { name: 'Juliet Vikings', tag: 'JUL' },
];

async function seed() {
  console.log('🚀 Starting seed...');

  const passwordHash = await hashPassword('athlon123');

  // Fetch all active modalities
  const allMods = await db.query.modalities.findMany({
    where: eq(modalities.isActive, true),
    with: { positions: true },
  });

  if (allMods.length === 0) {
    console.error('❌ No active modalities found. Please create some first.');
    process.exit(1);
  }

  const teamMods = allMods.filter(m => m.isTeamBased);
  const selectedMods = teamMods.length > 0 ? teamMods : allMods;

  console.log(`📊 Found ${selectedMods.length} modalities to use.`);

  for (let i = 0; i < CLUB_NAMES.length; i++) {
    const clubInfo = CLUB_NAMES[i];
    const mod = selectedMods[i % selectedMods.length];
    const availablePos = mod.positions.map(p => p.id);

    // 1. Create President
    const presEmail = `president${i + 1}@athlon.com`;
    const presidentName = `${clubInfo.name} President`;
    
    let presId: number;
    const existingPres = await db.query.users.findFirst({ where: eq(users.email, presEmail) });
    
    if (existingPres) {
      presId = existingPres.id;
      await db.update(users).set({ role: 'club_president' }).where(eq(users.id, presId));
    } else {
      const [res]: any = await db.insert(users).values({
        name: presidentName,
        email: presEmail,
        passwordHash,
        role: 'club_president',
        nickname: `pres${i + 1}`,
      });
      presId = res.insertId;
    }

    // 2. Create Club
    let clubId: number;
    const existingClub = await db.query.clubs.findFirst({ where: eq(clubs.name, clubInfo.name) });
    
    if (existingClub) {
      clubId = existingClub.id;
      await db.update(clubs).set({ presidentId: presId, modalityId: mod.id }).where(eq(clubs.id, clubId));
    } else {
      const [res]: any = await db.insert(clubs).values({
        name: clubInfo.name,
        tag: clubInfo.tag,
        presidentId: presId,
        modalityId: mod.id,
        location: 'São Paulo, BR',
      });
      clubId = res.insertId;
    }

    // Clear existing members
    await db.delete(clubMembers).where(eq(clubMembers.clubId, clubId));

    console.log(`🏠 [${i+1}/10] Club: ${clubInfo.name} (${clubInfo.tag}) - ID: ${clubId} - Mod: ${mod.name}`);

    // 3. Create 10 players per club (including president)
    for (let p = 0; p < 10; p++) {
      let playerId: number;

      if (p === 0) {
        playerId = presId;
      } else {
        const pEmail = `player_c${i + 1}_p${p}@athlon.com`;
        const pName = `Player ${p} ${clubInfo.tag}`;
        const pNick = `p${p}${clubInfo.tag.toLowerCase()}`;

        const existingPlayer = await db.query.users.findFirst({ where: eq(users.email, pEmail) });
        
        if (existingPlayer) {
          playerId = existingPlayer.id;
        } else {
          const [res]: any = await db.insert(users).values({
            name: pName,
            email: pEmail,
            passwordHash,
            role: 'player',
            nickname: pNick,
          });
          playerId = res.insertId;
        }
      }

      // Link player to modality and positions
      const primaryPosId = availablePos.length > 0 ? availablePos[p % availablePos.length] : null;
      const secondaryPosId = availablePos.length > 1 ? availablePos[(p + 1) % availablePos.length] : null;

      await db.delete(playerModalities).where(
        and(eq(playerModalities.userId, playerId), eq(playerModalities.modalityId, mod.id))
      );
      await db.insert(playerModalities).values({
        userId: playerId,
        modalityId: mod.id,
        primaryPositionId: primaryPosId,
        secondaryPositionId: secondaryPosId,
      });

      // Add to club_members
      await db.insert(clubMembers).values({
        clubId,
        userId: playerId,
        modalityId: mod.id,
        role: 'player', 
      });
    }
  }

  // 4. Create a Test Organization
  console.log('🏛️ Creating Test Organization...');
  const orgName = 'Federação de Teste Athlon';
  let orgId: number;
  const existingOrg = await db.query.organizations.findFirst({ where: eq(organizations.name, orgName) });
  
  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    // Arbitrarily pick the first president as org president too
    const firstPres = await db.query.users.findFirst({ where: eq(users.role, 'club_president') });
    const [res]: any = await db.insert(organizations).values({
      name: orgName,
      tag: 'FTA',
      presidentId: firstPres?.id || 1,
      status: 'active',
    });
    orgId = res.insertId;
  }

  // 5. Create a Test Competition (Football)
  console.log('🎮 Creating Test Competition...');
  const footballMod = allMods.find(m => m.name.toLowerCase().includes('futebol')) || allMods[0];
  const compName = 'Copa Athlon de Verão 2026';
  let compId: number;
  const existingComp = await db.query.competitions.findFirst({ where: eq(competitions.name, compName) });

  if (existingComp) {
    compId = existingComp.id;
  } else {
    const [res]: any = await db.insert(competitions).values({
      name: compName,
      modalityId: footballMod.id,
      organizationId: orgId,
      status: 'registration',
      maxTeams: 12,
      minPlayersPerTeam: 5,
      maxPlayersPerTeam: 15,
      startDate: new Date('2026-06-01'),
    });
    compId = res.insertId;
  }

  // 6. Register Clubs in Competition and Populate Rosters
  console.log('📝 Registering clubs and populating rosters...');
  const allClubs = await db.query.clubs.findMany({ 
    where: eq(clubs.modalityId, footballMod.id),
    limit: 10 
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

    // Clear existing roster for this registration
    await db.delete(competitionRosters).where(eq(competitionRosters.registrationId, regId));

    for (const member of members) {
      await db.insert(competitionRosters).values({
        registrationId: regId,
        userId: member.userId,
      });
    }
    console.log(`✅ Registered ${club.name} and added ${members.length} players to roster.`);
  }

  // 7. Add default Football Stat Types
  console.log('📊 Adding default football stat types...');
  const footballStats = [
    { name: 'Gols', unit: 'qtd' },
    { name: 'Assistências', unit: 'qtd' },
    { name: 'Cartão Amarelo', unit: 'qtd', isHigherBetter: false },
    { name: 'Cartão Vermelho', unit: 'qtd', isHigherBetter: false },
  ];

  for (const stat of footballStats) {
    const existingStat = await db.query.statTypes.findFirst({
      where: and(
        eq(statTypes.modalityId, footballMod.id),
        eq(statTypes.name, stat.name)
      )
    });

    if (!existingStat) {
      await db.insert(statTypes).values({
        modalityId: footballMod.id,
        name: stat.name,
        unit: stat.unit,
        isHigherBetter: stat.isHigherBetter ?? true,
      });
    }
  }

  console.log('✅ Seed finished successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
