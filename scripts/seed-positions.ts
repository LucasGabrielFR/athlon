import { db } from '../apps/api/src/db';
import { positions, playerModalities } from '../apps/api/src/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_POSITIONS = [
  { name: 'Goleiro', abbreviation: 'GOL' },
  { name: 'Zagueiro', abbreviation: 'ZAG' },
  { name: 'Lateral Direito', abbreviation: 'LD' },
  { name: 'Lateral Esquerdo', abbreviation: 'LE' },
  { name: 'Volante', abbreviation: 'VOL' },
  { name: 'Meia Central', abbreviation: 'MC' },
  { name: 'Meia Atacante', abbreviation: 'MEI' },
  { name: 'Ponta Direita', abbreviation: 'PD' },
  { name: 'Ponta Esquerda', abbreviation: 'PE' },
  { name: 'Atacante', abbreviation: 'ATA' },
];

async function seedPositions() {
  const modalityId = 1;

  console.log('Inserting default positions for FIFA (Modality 1)...');
  
  await db.insert(positions).values(
    DEFAULT_POSITIONS.map(p => ({
      modalityId,
      name: p.name,
      abbreviation: p.abbreviation,
    }))
  ).onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } }).catch(() => {
    return db.insert(positions).values(
      DEFAULT_POSITIONS.map(p => ({
        modalityId,
        name: p.name,
        abbreviation: p.abbreviation,
      }))
    );
  });

  const allPos = await db.select().from(positions).where(eq(positions.modalityId, modalityId));
  const posIds = allPos.map(p => p.id);
  
  console.log(`Inserted ${posIds.length} positions.`);

  if (posIds.length > 0) {
    console.log('Assigning positions to existing playerModalities...');
    const allPm = await db.select().from(playerModalities).where(eq(playerModalities.modalityId, modalityId));
    
    for (let i = 0; i < allPm.length; i++) {
      const pm = allPm[i];
      const primaryPos = posIds[i % posIds.length];
      const secondaryPos = posIds[(i + 1) % posIds.length];
      
      await db.update(playerModalities)
        .set({ primaryPositionId: primaryPos, secondaryPositionId: secondaryPos })
        .where(eq(playerModalities.id, pm.id));
    }
    console.log(`Assigned positions to ${allPm.length} players.`);
  }
  
  console.log('Done!');
  process.exit(0);
}

import { sql } from 'drizzle-orm';
seedPositions().catch(console.error);
