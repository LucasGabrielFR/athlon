import { db } from './src/db';
import { clubs, clubMembers } from './src/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function syncClubsModality() {
  const clubsToUpdate = await db.query.clubs.findMany({
    where: isNull(clubs.modalityId)
  });

  console.log(`Found ${clubsToUpdate.length} clubs without modalityId.`);

  for (const club of clubsToUpdate) {
    const firstMember = await db.query.clubMembers.findFirst({
      where: eq(clubMembers.clubId, club.id)
    });

    if (firstMember) {
      console.log(`Updating club ${club.name} to modality ${firstMember.modalityId}`);
      await db.update(clubs)
        .set({ modalityId: firstMember.modalityId })
        .where(eq(clubs.id, club.id));
    } else {
      console.log(`Club ${club.name} has no members to infer modality from.`);
    }
  }
}

syncClubsModality().catch(console.error);
