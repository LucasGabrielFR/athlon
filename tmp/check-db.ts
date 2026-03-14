import { db } from './src/db';
import { clubs, clubMembers } from './src/db/schema';

async function checkData() {
  const allClubs = await db.query.clubs.findMany();
  console.log('Clubs Modality IDs:');
  allClubs.forEach(c => console.log(`Club: ${c.name} (ID: ${c.id}), Modality: ${c.modalityId}`));

  const allMembers = await db.query.clubMembers.findMany({
    with: { club: true, modality: true }
  });
  console.log('\nMemberships:');
  allMembers.forEach(m => console.log(`User ID: ${m.userId}, Club: ${m.club.name}, Modality: ${m.modality.name} (ID: ${m.modalityId})`));
}

checkData().catch(console.error);
