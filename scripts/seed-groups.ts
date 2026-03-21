import { db } from "../src/db";
import { competitions, clubs, competitionRegistrations } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding Groups + Knockout Competition...");

  // 1. Get or Create 8 Clubs
  const allClubs = await db.query.clubs.findMany({ limit: 8 });
  if (allClubs.length < 8) {
    console.log("Not enough clubs. Run generic seed first.");
    process.exit(1);
  }

  // 2. Create Competition
  const compName = "Champions Athlon: Grupos 2026";
  const [res]: any = await db.insert(competitions).values({
    name: compName,
    modalityId: 2, // FIFA 26 - Pro Clubs
    format: "groups_knockout",
    status: "registration",
    maxTeams: 8,
    entryFee: 50,
    prizePool: 500,
    groupsConfig: { groupsCount: 2, advancingPerGroup: 2 },
    knockoutConfig: { matchupFormat: "single_leg", tieBreaker: "penalties" },
    startDate: new Date(),
  });
  
  const compId = res.insertId;
  console.log(`Competition created with ID: ${compId}`);

  // 3. Register 8 Clubs
  for (const club of allClubs) {
    await db.insert(competitionRegistrations).values({
      competitionId: compId,
      clubId: club.id,
      status: "approved",
    });
  }

  console.log("✅ 8 Clubs registered and approved.");
  console.log("Next step: Go to the dashboard and start the tournament to generate matches.");
}

main().catch(console.error).finally(() => process.exit(0));
