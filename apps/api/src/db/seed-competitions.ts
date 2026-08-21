import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { eq, inArray } from 'drizzle-orm';

dotenv.config();

async function runSeed() {
  console.log('🌱 Iniciando Seed Avançado de Competições E2E...');

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection, { schema, mode: 'default' });

  // 1. Validar Entidades Existentes
  const users = await db.select().from(schema.users);
  if (users.length === 0) throw new Error('Crie usuários primeiro!');

  const allClubs = await db.select().from(schema.clubs);
  if (allClubs.length < 4) throw new Error('Preciso de pelo menos 4 clubes criados.');

  const modalities = await db.select().from(schema.modalities);
  if (modalities.length === 0) throw new Error('Crie pelo menos uma modalidade!');
  
  const orgs = await db.select().from(schema.organizations);
  const orgId = orgs.length > 0 ? orgs[0].id : (await db.insert(schema.organizations).values({ name: 'Athlon Fed', tag: 'ATH', presidentId: users[0].id }))[0].insertId;

  // Pegar os primeiros 10 clubes
  const clubsToUse = allClubs.slice(0, 10);
  console.log(`Usando ${clubsToUse.length} clubes existentes.`);

  // Pegar os membros desses clubes
  const clubIds = clubsToUse.map(c => c.id);
  const clubMembers = await db.select().from(schema.clubMembers).where(inArray(schema.clubMembers.clubId, clubIds));

  // Helper para inscrever times com elencos
  async function registerTeams(compId: number, numTeams: number, status: 'pending' | 'approved' = 'approved', offset: number = 0) {
    for (let i = 0; i < numTeams; i++) {
      const club = clubsToUse[offset + i];
      if (!club) break;
      const [regRes] = await db.insert(schema.competitionRegistrations).values({
        competitionId: compId,
        clubId: club.id,
        status: status
      });
      const regId = (regRes as any).insertId;

      // Pegar os jogadores deste clube e colocar na roster da competição
      const members = clubMembers.filter(m => m.clubId === club.id);
      if (members.length > 0) {
        await db.insert(schema.competitionRosters).values(
          members.map(m => ({
            registrationId: regId,
            userId: m.userId,
            isStarter: true,
            status: 'active'
          }))
        );
      }
    }
  }

  const formats = ['league', 'knockout', 'groups_knockout'];
  const states = ['registration', 'active', 'finished']; // MUDANÇA AQUI: 'open' -> 'registration', 'running' -> 'active'

  // Limpar competições antigas para evitar lixo visual
  await db.delete(schema.competitions);

  for (const format of formats) {
    for (const state of states) {
      console.log(`🏆 Criando: ${format.toUpperCase()} - ${state.toUpperCase()}`);
      
      const compName = `Test ${format} ${state} 2026`;
      
      const [compRes] = await db.insert(schema.competitions).values({
        organizationId: orgId as number,
        modalityId: modalities[0].id,
        name: compName,
        format: format,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: state,
        entryFee: 0,
        prizePool: 10000,
        maxTeams: 16,
        minPlayersPerTeam: 5,
        maxPlayersPerTeam: 15,
        groupsConfig: {
          pointsPerWin: 3,
          pointsPerDraw: 1,
          pointsPerLoss: 0,
          groupsCount: format === 'groups_knockout' ? 2 : undefined,
          advancingPerGroup: format === 'groups_knockout' ? 2 : undefined,
          tieBreakerOrder: ['pts', 'wins', 'goalDiff', 'goalsFor']
        }
      });
      const compId = (compRes as any).insertId;

      if (state === 'registration') {
        // Registration: 10 approved (conforme pedido)
        await registerTeams(compId, 10, 'approved', 0);
      } else if (state === 'active' || state === 'finished') {
        // Active or finished: 10 approved teams
        await registerTeams(compId, 10, 'approved', 0);

        const regs = await db.select().from(schema.competitionRegistrations).where(eq(schema.competitionRegistrations.competitionId, compId));

        // Partidas
        if (format === 'league') {
          // Liga (todos contra todos - round 1 e 2 apenas para o teste)
          const mStatus = state === 'finished' ? 'finished' : 'finished';
          
          // Match 1 (sempre finished)
          const [m1] = await db.insert(schema.matches).values({
            competitionId: compId, round: 1, homeRegistrationId: regs[0].id, awayRegistrationId: regs[1].id,
            status: 'finished', homeScore: 2, awayScore: 1
          });
          
          // Match 2 (se running, pode estar live ou scheduled)
          const m2Status = state === 'finished' ? 'finished' : 'live';
          const [m2] = await db.insert(schema.matches).values({
            competitionId: compId, round: 1, homeRegistrationId: regs[2].id, awayRegistrationId: regs[3].id,
            status: m2Status, homeScore: state === 'finished' ? 3 : 1, awayScore: state === 'finished' ? 0 : 1
          });

          // Se estiver live ou finished, adicionar eventos
          if (m2Status === 'live' || m2Status === 'finished') {
            const match2Id = (m2 as any).insertId;
            // Acha um jogador do time da casa
            const homePlayers = await db.select().from(schema.competitionRosters).where(eq(schema.competitionRosters.registrationId, regs[2].id));
            if (homePlayers.length > 0) {
              await db.insert(schema.matchEvents).values({
                matchId: match2Id,
                registrationId: regs[2].id,
                playerId: homePlayers[0].userId,
                type: 'goal',
                minute: 34,
                metadata: { description: 'Gol de fora da área!' }
              });
              
              // Se finished, vamos jogar também uns status de match player
              if (m2Status === 'finished') {
                  await db.insert(schema.matchPlayerStats).values({
                    matchId: match2Id,
                    playerId: homePlayers[0].userId,
                    registrationId: regs[2].id,
                    goals: 1,
                    assists: 0,
                    rating: 8.5
                  });
              }
            }
          }
        } else if (format === 'knockout') {
          // Semi-final e Final (3 matches para 4 times)
          const s1 = state === 'finished' ? 'finished' : 'finished';
          const [m1] = await db.insert(schema.matches).values({
            competitionId: compId, round: 1, stage: 'knockout', homeRegistrationId: regs[0].id, awayRegistrationId: regs[1].id,
            status: s1, homeScore: 2, awayScore: 0
          });
          const [m2] = await db.insert(schema.matches).values({
            competitionId: compId, round: 1, stage: 'knockout', homeRegistrationId: regs[2].id, awayRegistrationId: regs[3].id,
            status: s1, homeScore: 1, awayScore: 2
          });
          
          // Final (somente se não for running ou se já passou pra próxima)
          const fStatus = state === 'finished' ? 'finished' : 'scheduled';
          await db.insert(schema.matches).values({
            competitionId: compId, round: 2, stage: 'knockout', homeRegistrationId: regs[0].id, awayRegistrationId: regs[3].id,
            status: fStatus, homeScore: state === 'finished' ? 3 : 0, awayScore: state === 'finished' ? 1 : 0
          });
        }
      }
    }
  }

  console.log('✅ Seed finalizado com sucesso! Foram geradas 9 competições (3 formatos x 3 status) com rosters reais, matches e stats.');
  process.exit(0);
}

runSeed().catch(console.error);
