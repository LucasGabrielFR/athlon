import { db } from '../src/db';
import { users, clubs, clubMembers, modalities, positions, playerModalities } from '../src/db/schema';
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
      await db.update(clubs).set({ presidentId: presId }).where(eq(clubs.id, clubId));
    } else {
      const [res]: any = await db.insert(clubs).values({
        name: clubInfo.name,
        tag: clubInfo.tag,
        presidentId: presId,
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

  console.log('✅ Seed finished successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
