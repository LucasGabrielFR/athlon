'use server';

import { db } from '@/db';
import { 
  competitions, 
  competitionRegistrations, 
  competitionRosters, 
  organizations, 
  clubs, 
  clubMembers,
  competitionPosts,
  matches,
  matchEvents
} from '@/db/schema';

import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// ── Helpers ────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = Number((session.user as { id?: string | number }).id);
  const role = (session.user as { role?: string }).role ?? 'player';
  return { userId, role };
}

async function requireOrganizerOrOrganizationPresident(competitionId: number, userId: number, role: string) {
  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, competitionId),
  });

  if (!comp) throw new Error('Competição não encontrada.');

  if (role === 'admin') return comp;

  if (comp.organizerId === userId) return comp;

  if (comp.organizationId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, comp.organizationId),
    });
    if (org?.presidentId === userId) return comp;
  }

  throw new Error('Acesso negado.');
}


// ── Competition Wizard ─────────────────────────────────────────────────────

export async function createCompetitionAction(formData: FormData) {
  const { userId, role } = await requireSession();

  const name = (formData.get('name') as string)?.trim();
  const modalityId = Number(formData.get('modalityId'));
  const organizationId = formData.get('organizationId') ? Number(formData.get('organizationId')) : null;
  const format = (formData.get('format') as string) || 'round_robin';
  const entryFee = Number(formData.get('entryFee')) || 0;
  const prizePool = Number(formData.get('prizePool')) || 0;
  
  const maxTeams = formData.get('maxTeams') ? Number(formData.get('maxTeams')) : null;
  const minPlayersPerTeam = Number(formData.get('minPlayersPerTeam')) || 1;
  const maxPlayersPerTeam = formData.get('maxPlayersPerTeam') ? Number(formData.get('maxPlayersPerTeam')) : null;

  // Registration Schedule
  const registrationStartDate = formData.get('registrationStartDate') ? new Date(formData.get('registrationStartDate') as string) : null;
  const registrationEndDate = formData.get('registrationEndDate') ? new Date(formData.get('registrationEndDate') as string) : null;
  
  const windowType = formData.get('windowType') as string;
  let registrationWindows = null;
  if (windowType && windowType !== 'none') {
    registrationWindows = {
      type: windowType,
      day: Number(formData.get('windowDay')) || 1,
      duration: Number(formData.get('windowDuration')) || 1,
    };
  }

  // Knockout Settings
  let knockoutConfig = null;
  if (format === 'knockout' || format === 'groups_knockout') {
    knockoutConfig = {
      matchupFormat: formData.get('matchupFormat') as string || 'single',
      tieBreaker: formData.get('tieBreaker') as string || 'extra_time_then_penalties'
    };
  }

  // Groups Settings
  let groupsConfig = null;
  if (format === 'groups_knockout' || format === 'round_robin') {
    const tieOrderRaw = (formData.get('tieBreakerOrder') as string);
    groupsConfig = {
      groupsCount: Number(formData.get('groupsCount')) || 2,
      advancingPerGroup: Number(formData.get('advancingPerGroup')) || 2,
      pointsPerWin: formData.get('pointsPerWin') ? Number(formData.get('pointsPerWin')) : 3,
      pointsPerDraw: formData.get('pointsPerDraw') ? Number(formData.get('pointsPerDraw')) : 1,
      pointsPerLoss: formData.get('pointsPerLoss') ? Number(formData.get('pointsPerLoss')) : 0,
      tieBreakerOrder: tieOrderRaw ? tieOrderRaw.split(',').map(s => s.trim()) : ['pts', 'wins', 'goalDiff', 'goalsFor']
    };
  }


  if (!name || !modalityId || !organizationId) {
    redirect('/dashboard/competitions/new?error=missing_fields');
  }

  // Enforce: Only Org President or Admin can create
  if (role !== 'admin' && role !== 'org_president') {
    throw new Error('Apenas presidentes de organização podem criar competições.');
  }

  // Verify ownership of the organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org || org.presidentId !== userId) {
    throw new Error('Você deve ser o presidente da organização selecionada para criar uma competição nela.');
  }

  const [newComp] = await db.insert(competitions).values({
    name,
    modalityId,
    organizationId,
    organizerId: userId,
    format,
    entryFee,
    prizePool,
    maxTeams,
    minPlayersPerTeam,
    maxPlayersPerTeam,
    registrationStartDate,
    registrationEndDate,
    registrationWindows,
    knockoutConfig,
    groupsConfig,
    status: 'planned',
  }).$returningId();

  if (!newComp?.id) redirect('/dashboard/competitions?error=creation_failed');

  revalidatePath('/dashboard/competitions');
  redirect(`/dashboard/competitions/${newComp.id}`);
}

// ── Club Registration ──────────────────────────────────────────────────────

export async function registerClubAction(formData: FormData) {
  const { userId } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));
  const clubId = Number(formData.get('clubId'));

  if (!competitionId || !clubId) return;

  // Verify user is club president
  const club = await db.query.clubs.findFirst({ where: eq(clubs.id, clubId) });
  if (!club || club.presidentId !== userId) {
    throw new Error('Apenas o presidente do clube pode inscrever a equipe.');
  }

  // Check if already registered
  const existing = await db.query.competitionRegistrations.findFirst({
    where: and(
      eq(competitionRegistrations.competitionId, competitionId),
      eq(competitionRegistrations.clubId, clubId)
    ),
  });

  if (existing) return;

  await db.insert(competitionRegistrations).values({
    competitionId,
    clubId,
    status: 'pending',
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

// ── Approve Registration ───────────────────────────────────────────────────

export async function approveRegistrationAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const registrationId = Number(formData.get('registrationId'));

  if (!registrationId) return;

  const reg = await db.query.competitionRegistrations.findFirst({
    where: eq(competitionRegistrations.id, registrationId),
  });

  if (!reg) return;

  await requireOrganizerOrOrganizationPresident(reg.competitionId, userId, role);

  await db.update(competitionRegistrations)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(competitionRegistrations.id, registrationId));

  revalidatePath(`/dashboard/competitions/${reg.competitionId}`);
}

// ── Roster Management ──────────────────────────────────────────────────────

export async function addToRosterAction(formData: FormData) {
  const { userId } = await requireSession();
  const registrationId = Number(formData.get('registrationId'));
  const targetUserId = Number(formData.get('targetUserId'));

  if (!registrationId || !targetUserId) return;

  const reg = await db.query.competitionRegistrations.findFirst({
    where: eq(competitionRegistrations.id, registrationId),
  });

  if (!reg) return;

  // Verify club president
  const club = await db.query.clubs.findFirst({ where: eq(clubs.id, reg.clubId) });
  if (!club || club.presidentId !== userId) return;

  // Verify competition limits
  const comp = await db.query.competitions.findFirst({ where: eq(competitions.id, reg.competitionId) });
  if (comp?.maxPlayersPerTeam) {
    const currentRoster = await db.query.competitionRosters.findMany({
      where: eq(competitionRosters.registrationId, registrationId),
    });
    if (currentRoster.length >= comp.maxPlayersPerTeam) {
      throw new Error(`Limite de ${comp.maxPlayersPerTeam} jogadores atingido.`);
    }
  }

  // Add to roster
  await db.insert(competitionRosters).values({
    registrationId,
    userId: targetUserId,
  });

  revalidatePath(`/dashboard/competitions/${reg.competitionId}/roster`);
}

// ── Admin Management ───────────────────────────────────────────────────────

export async function deleteCompetitionAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, competitionId),
    with: { organization: true }
  });

  if (!comp) throw new Error('Competição não encontrada.');

  // Permission Logic:
  // - Admin can delete anything.
  // - Organizer/Org President can only delete if status is 'planned'.
  const isAdmin = role === 'admin';
  const isOrganizer = comp.organizerId === userId || comp.organization?.presidentId === userId;

  if (!isAdmin) {
    if (!isOrganizer) throw new Error('Acesso negado.');
    if (comp.status !== 'planned') {
      throw new Error('Apenas administradores podem excluir uma competição que já saiu do planejamento.');
    }
  }

  // Explicit deletion of all related data to ensure 100% clearing:
  await db.transaction(async (tx) => {
    // 1. Fetch related IDs for nested child deletion
    const compMatches = await tx.query.matches.findMany({ where: eq(matches.competitionId, competitionId) });
    const matchIds = compMatches.map(m => m.id);
    
    const regs = await tx.query.competitionRegistrations.findMany({ where: eq(competitionRegistrations.competitionId, competitionId) });
    const regIds = regs.map(r => r.id);

    // 2. Cascade delete manually (some engines don't support it or if it's disabled)
    if (matchIds.length > 0) {
      await tx.delete(matchEvents).where(inArray(matchEvents.matchId, matchIds));
      await tx.delete(matches).where(inArray(matches.id, matchIds));
    }

    if (regIds.length > 0) {
      await tx.delete(competitionRosters).where(inArray(competitionRosters.registrationId, regIds));
      await tx.delete(competitionRegistrations).where(inArray(competitionRegistrations.id, regIds));
    }

    await tx.delete(competitionPosts).where(eq(competitionPosts.competitionId, competitionId));

    // 3. Finally, the competition itself
    await tx.delete(competitions).where(eq(competitions.id, competitionId));
  });

  revalidatePath('/dashboard/competitions');
  redirect('/dashboard/competitions');
}

export async function deactivateCompetitionAction(formData: FormData) {
  const { role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  if (role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem gerenciar o status de competições.');
  }

  const comp = await db.query.competitions.findFirst({
    where: eq(competitions.id, competitionId),
  });

  if (!comp) throw new Error('Competição não encontrada.');

  const newStatus = comp.status === 'deactivated' ? 'planned' : 'deactivated';

  await db.update(competitions)
    .set({ status: newStatus })
    .where(eq(competitions.id, competitionId));

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

// ── Competition Management ──────────────────────────────────────────────────

export async function updateCompetitionAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  const comp = await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const rulesJson = formData.get('rulesJson') ? JSON.parse(formData.get('rulesJson') as string) : comp.rulesJson;

  // Fields with restrictions if status !== 'planned'
  const updates: any = { name, description, rulesJson };

  if (comp.status === 'planned' || role === 'admin') {
    updates.maxTeams = formData.get('maxTeams') ? Number(formData.get('maxTeams')) : comp.maxTeams;
    updates.minPlayersPerTeam = formData.get('minPlayersPerTeam') ? Number(formData.get('minPlayersPerTeam')) : comp.minPlayersPerTeam;
    updates.maxPlayersPerTeam = formData.get('maxPlayersPerTeam') ? Number(formData.get('maxPlayersPerTeam')) : comp.maxPlayersPerTeam;
    updates.entryFee = formData.get('entryFee') ? Number(formData.get('entryFee')) : comp.entryFee;
    updates.prizePool = formData.get('prizePool') ? Number(formData.get('prizePool')) : comp.prizePool;
    
    if (comp.format === 'knockout' || comp.format === 'groups_knockout') {
      const config = comp.knockoutConfig as any;
      updates.knockoutConfig = {
        matchupFormat: formData.get('matchupFormat') as string || config?.matchupFormat || 'single',
        tieBreaker: formData.get('tieBreaker') as string || config?.tieBreaker || 'extra_time_then_penalties'
      };
    }

    if (comp.format === 'groups_knockout' || comp.format === 'league' || comp.format === 'round_robin') {
      const gConfig = comp.groupsConfig as any;
      const tieOrderRaw = (formData.get('tieBreakerOrder') as string);
      updates.groupsConfig = {
        groupsCount: formData.get('groupsCount') ? Number(formData.get('groupsCount')) : (gConfig?.groupsCount || 2),
        advancingPerGroup: formData.get('advancingPerGroup') ? Number(formData.get('advancingPerGroup')) : (gConfig?.advancingPerGroup || 2),
        pointsPerWin: formData.get('pointsPerWin') ? Number(formData.get('pointsPerWin')) : (gConfig?.pointsPerWin ?? 3),
        pointsPerDraw: formData.get('pointsPerDraw') ? Number(formData.get('pointsPerDraw')) : (gConfig?.pointsPerDraw ?? 1),
        pointsPerLoss: formData.get('pointsPerLoss') ? Number(formData.get('pointsPerLoss')) : (gConfig?.pointsPerLoss ?? 0),
        tieBreakerOrder: tieOrderRaw ? tieOrderRaw.split(',').map(s => s.trim()) : (gConfig?.tieBreakerOrder || ['pts', 'wins', 'goalDiff', 'goalsFor'])
      };
    }
  }

  await db.update(competitions)
    .set(updates)
    .where(eq(competitions.id, competitionId));

  revalidatePath(`/dashboard/competitions/${competitionId}`);
  return { success: true };
}

export async function toggleManualStatusAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));
  const field = formData.get('field') as 'isRegistrationManualOpen' | 'isWindowManualOpen';

  const comp = await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

  const newValue = !comp[field];

  await db.update(competitions)
    .set({ [field]: newValue })
    .where(eq(competitions.id, competitionId));

  // Create system post
  const message = field === 'isRegistrationManualOpen' 
    ? (newValue ? "🚀 Inscrições abertas manualmente pelo organizador." : "🔒 Inscrições encerradas manualmente pelo organizador.")
    : (newValue ? "🔄 Janela de transferências aberta manualmente." : "⏹️ Janela de transferências encerrada manualmente.");

  await db.insert(competitionPosts).values({
    competitionId,
    authorId: userId,
    type: 'system',
    content: message,
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

export async function createCompetitionPostAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));
  const content = (formData.get('content') as string)?.trim();

  if (!content) return;

  await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

  await db.insert(competitionPosts).values({
    competitionId,
    authorId: userId,
    type: 'post',
    content,
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
}

export async function togglePinPostAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const postId = Number(formData.get('postId'));

  const post = await db.query.competitionPosts.findFirst({
    where: eq(competitionPosts.id, postId),
  });

  if (!post) return;

  await requireOrganizerOrOrganizationPresident(post.competitionId, userId, role);

  await db.update(competitionPosts)
    .set({ isPinned: !post.isPinned })
    .where(eq(competitionPosts.id, postId));

  revalidatePath(`/dashboard/competitions/${post.competitionId}`);
}

export async function generateMatchesAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const competitionId = Number(formData.get('competitionId'));

  try {
    const comp = await requireOrganizerOrOrganizationPresident(competitionId, userId, role);

    if (comp.status === 'active') {
      throw new Error('A competição já está ativa e as partidas foram geradas.');
    }

    const registrations = await db.query.competitionRegistrations.findMany({
      where: and(
        eq(competitionRegistrations.competitionId, competitionId),
        eq(competitionRegistrations.status, 'approved')
      ),
    });

    if (registrations.length < 2) {
      throw new Error('É necessário pelo menos 2 equipes aprovadas para gerar as partidas.');
    }

    const matchesToInsert: any[] = [];

    await db.transaction(async (tx) => {
      if (comp.format === 'knockout') {
        // Knockout Bracket Logic
        const teamIds = registrations.map(r => r.id);
        
        // Shuffle teams randomly
        for (let i = teamIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
        }

        const totalTeams = teamIds.length;
        let powerOfTwo = 1;
        while (powerOfTwo < totalTeams) powerOfTwo *= 2;
        const byes = powerOfTwo - totalTeams;

        // Round 1
        const totalFirstRoundMatches = powerOfTwo / 2;
        let teamIndex = 0;
        
        for (let i = 0; i < totalFirstRoundMatches; i++) {
          const home = teamIds[teamIndex++];
          const isByeMatch = i >= (totalFirstRoundMatches - byes);
          const away = isByeMatch ? null : teamIds[teamIndex++];
          
          matchesToInsert.push({
            competitionId,
            homeRegistrationId: home,
            awayRegistrationId: away,
            round: 1,
            status: isByeMatch ? 'finished' : 'scheduled',
            homeScore: isByeMatch ? 1 : 0,
            awayScore: isByeMatch ? 0 : 0,
            stage: 'knockout'
          });
        }

        // Future Rounds
        let matchesInRound = totalFirstRoundMatches / 2;
        let currentRound = 2;
        while (matchesInRound >= 1) {
          for (let i = 0; i < matchesInRound; i++) {
            matchesToInsert.push({
              competitionId,
              homeRegistrationId: null,
              awayRegistrationId: null,
              round: currentRound,
              status: 'scheduled',
              homeScore: 0,
              awayScore: 0,
              stage: 'knockout'
            });
          }
          matchesInRound /= 2;
          currentRound++;
        }

        // Handle Immediate Advancement for Byes in Round 1
        const totalR1 = totalFirstRoundMatches;
        for (let i = 0; i < totalR1; i++) {
          const m = matchesToInsert[i];
          if (m.status === 'finished' && m.round === 1) {
             const winnerId = m.homeRegistrationId;
             const nextMatchIndex = Math.floor(i / 2);
             const isHome = i % 2 === 0;
             const r2Start = totalR1;
             const targetMatch = matchesToInsert[r2Start + nextMatchIndex];
             if (targetMatch) {
                if (isHome) targetMatch.homeRegistrationId = winnerId;
                else targetMatch.awayRegistrationId = winnerId;
             }
          }
        }
      } else if (comp.format === 'groups_knockout') {
        const numGroups = (comp.groupsConfig as any)?.groupsCount || 2;
        const shuffeled = [...registrations].sort(() => Math.random() - 0.5);
        
        // 1. Assign Groups
        for (let i = 0; i < shuffeled.length; i++) {
          const groupId = String.fromCharCode(65 + (i % numGroups));
          await tx.update(competitionRegistrations)
            .set({ groupId })
            .where(eq(competitionRegistrations.id, shuffeled[i].id));
          shuffeled[i].groupId = groupId;
        }

        // 2. Generate matches per group
        for (let g = 0; g < numGroups; g++) {
          const gId = String.fromCharCode(65 + g);
          const groupTeams = shuffeled.filter(r => (r as any).groupId === gId).map(r => r.id);
          const nTeams = groupTeams.length;
          if (nTeams < 2) continue;

          const nRounds = (nTeams % 2 === 0) ? nTeams - 1 : nTeams;
          const teamsForRR = [...groupTeams];
          if (nTeams % 2 !== 0) teamsForRR.push(-1); // Bye

          for (let round = 0; round < nRounds; round++) {
            for (let i = 0; i < teamsForRR.length / 2; i++) {
              const home = teamsForRR[i];
              const away = teamsForRR[teamsForRR.length - 1 - i];
              if (home !== -1 && away !== -1) {
                matchesToInsert.push({
                  competitionId,
                  homeRegistrationId: home,
                  awayRegistrationId: away,
                  round: round + 1,
                  status: 'scheduled',
                  stage: 'groups',
                  homeScore: 0,
                  awayScore: 0,
                });
              }
            }
            teamsForRR.splice(1, 0, teamsForRR.pop()!);
          }
        }

        // 3. Generate Knockout Placeholders
        const advPerGroup = (comp.groupsConfig as any)?.advancingPerGroup || 2;
        const totalKnockoutTeams = numGroups * advPerGroup;
        
        if (totalKnockoutTeams >= 2) {
          let matchesInRound = totalKnockoutTeams / 2;
          let kRound = 1;
          while (matchesInRound >= 1) {
            for (let i = 0; i < matchesInRound; i++) {
              matchesToInsert.push({
                competitionId,
                round: kRound,
                status: 'scheduled',
                stage: 'knockout',
                homeScore: 0,
                awayScore: 0,
              });
            }
            matchesInRound /= 2;
            kRound++;
          }
        }
      } else {
        // League / Tournament (Round Robin)
        const teamIds = registrations.map(r => r.id);
        if (teamIds.length % 2 !== 0) teamIds.push(-1);

        const numTeams = teamIds.length;
        const numRounds = numTeams - 1;

        for (let round = 0; round < numRounds; round++) {
          for (let i = 0; i < numTeams / 2; i++) {
            const home = teamIds[i];
            const away = teamIds[numTeams - 1 - i];

            if (home !== -1 && away !== -1) {
              matchesToInsert.push({
                competitionId,
                homeRegistrationId: home,
                awayRegistrationId: away,
                round: round + 1,
                status: 'scheduled',
                stage: 'regular',
                homeScore: 0,
                awayScore: 0,
              });
            }
          }
          teamIds.splice(1, 0, teamIds.pop()!);
        }
      }

      // 1. Update status
      await tx.update(competitions)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(competitions.id, competitionId));

      // 2. Insert matches
      if (matchesToInsert.length > 0) {
        await tx.insert(matches).values(matchesToInsert);
      }

      // 3. System post
      await tx.insert(competitionPosts).values({
        competitionId,
        authorId: userId,
        type: 'system',
        content: `🏁 Competição Iniciada! ${matchesToInsert.length} partidas foram geradas. Que comecem os jogos!`,
      });
    });

    revalidatePath(`/dashboard/competitions/${competitionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Match Generation Error:', err);
    return { success: false, error: err.message };
  }
}

export async function recordMatchEventAction(formData: FormData) {
  const { userId, role } = await requireSession();
  const matchId = Number(formData.get('matchId'));
  const registrationId = Number(formData.get('registrationId'));
  const playerId = Number(formData.get('playerId'));
  const type = String(formData.get('type'));
  const minute = Number(formData.get('minute')) || 0;

  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        competition: true,
      },
    });

    if (!match) throw new Error('Partida não encontrada.');
    if (match.status === 'finished') throw new Error('A partida já foi finalizada.');

    // Authorization logic
    let isAuthorized = role === 'admin' || 
                       match.competition.organizerId === userId || 
                       (match.competition.organizationId && (await db.query.organizations.findFirst({ where: eq(organizations.id, match.competition.organizationId) }))?.presidentId === userId);

    if (!isAuthorized) {
       // Check if user is president of one of the competing clubs
       const homeClub = match.homeRegistrationId ? await db.query.clubs.findFirst({ where: eq(clubs.id, match.homeRegistrationId) }) : null;
       const awayClub = match.awayRegistrationId ? await db.query.clubs.findFirst({ where: eq(clubs.id, match.awayRegistrationId) }) : null;
       
       if (homeClub?.presidentId === userId || awayClub?.presidentId === userId) {
          isAuthorized = true;
       }
    }

    if (!isAuthorized) throw new Error('Acesso negado.');

    await db.transaction(async (tx) => {
      // 1. Insert event
      await tx.insert(matchEvents).values({
        matchId,
        registrationId,
        playerId,
        type,
        minute,
        metadata: null,
      });

      // 2. Update overall score if it's a scoring event
      const scoringTypes = ['gol', 'gols', 'kill', 'ponto'];
      const isGoal = scoringTypes.includes(type.toLowerCase());
      if (isGoal) {
        if (registrationId === match.homeRegistrationId) {
          await tx.update(matches)
            .set({ homeScore: (match.homeScore || 0) + 1 })
            .where(eq(matches.id, matchId));
        } else if (registrationId === match.awayRegistrationId) {
          await tx.update(matches)
            .set({ awayScore: (match.awayScore || 0) + 1 })
            .where(eq(matches.id, matchId));
        }
      }
    });

    revalidatePath(`/dashboard/competitions/${match.competitionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Record Event Error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateMatchStatusAction(
  matchId: number,
  status: 'scheduled' | 'live' | 'finished' | 'canceled'
) {
  const { userId, role } = await requireSession();

  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
    });
    if (!match) throw new Error('Partida não encontrada.');

    const comp = await db.query.competitions.findFirst({ where: eq(competitions.id, match.competitionId) });
    if (!comp) throw new Error('Competição não encontrada.');

    // Authorization logic
    let isAuthorized = role === 'admin' || 
                       comp.organizerId === userId || 
                       (comp.organizationId && (await db.query.organizations.findFirst({ where: eq(organizations.id, comp.organizationId) }))?.presidentId === userId);

    if (!isAuthorized) {
       const homeClub = match.homeRegistrationId ? await db.query.clubs.findFirst({ where: eq(clubs.id, match.homeRegistrationId) }) : null;
       const awayClub = match.awayRegistrationId ? await db.query.clubs.findFirst({ where: eq(clubs.id, match.awayRegistrationId) }) : null;
       
       if (homeClub?.presidentId === userId || awayClub?.presidentId === userId) {
          isAuthorized = true;
       }
    }

    if (!isAuthorized) throw new Error('Acesso negado.');

    const homeReg = match.homeRegistrationId ? await db.query.competitionRegistrations.findFirst({
      where: eq(competitionRegistrations.id, match.homeRegistrationId),
      with: { club: true }
    }) : null;
    const awayReg = match.awayRegistrationId ? await db.query.competitionRegistrations.findFirst({
      where: eq(competitionRegistrations.id, match.awayRegistrationId),
      with: { club: true }
    }) : null;

    const homeName = homeReg?.club?.name || 'TBD';
    const awayName = awayReg?.club?.name || 'TBD';

    await db.transaction(async (tx) => {
      // 1. Update status
      await tx.update(matches)
        .set({ status, updatedAt: new Date() })
        .where(eq(matches.id, matchId));

      // 2. Create system notification post
      let message = '';
      if (status === 'live') {
        message = `⚔️ Partida iniciada: **${homeName}** x **${awayName}**! Acompanhe em tempo real.`;
      } else if (status === 'finished') {
        // Fetch current match score for the message if finished
        const currentMatch = await tx.query.matches.findFirst({ where: eq(matches.id, matchId) });
        message = `🏁 Partida finalizada! **${homeName} ${currentMatch?.homeScore} x ${currentMatch?.awayScore} ${awayName}**. Confira o resultado na tabela.`;
      }

      if (message) {
        await tx.insert(competitionPosts).values({
          competitionId: match.competitionId,
          authorId: userId,
          type: 'system',
          content: message,
          createdAt: new Date(),
        });
      }

      // Knockout Component Progression
      if (status === 'finished' && (comp.format === 'knockout' || comp.format === 'groups_knockout')) {
        const currentMatch = await tx.query.matches.findFirst({ where: eq(matches.id, matchId) });
        if (currentMatch && currentMatch.round) {
          const hScore = currentMatch.homeScore || 0;
          const aScore = currentMatch.awayScore || 0;
          let winnerId: number | null = null;
          if (hScore > aScore) winnerId = currentMatch.homeRegistrationId;
          else if (aScore > hScore) winnerId = currentMatch.awayRegistrationId;
          // Note: if tied and penaltys/extra time is enabled, the match should either reflect this in score or we need custom tie-breaker field. For now, we assume simple tie-breaker by score.

          if (winnerId) {
             const roundMatches = await tx.query.matches.findMany({
               where: and(eq(matches.competitionId, match.competitionId), eq(matches.round, currentMatch.round)),
               orderBy: (m, { asc }) => [asc(m.id)]
             });
             const matchIndex = roundMatches.findIndex(m => m.id === currentMatch.id);
             
             if (matchIndex !== -1) {
               const nextRound = currentMatch.round + 1;
               const nextMatchIndex = Math.floor(matchIndex / 2);
               const isHome = matchIndex % 2 === 0;

               const nextRoundMatches = await tx.query.matches.findMany({
                 where: and(eq(matches.competitionId, match.competitionId), eq(matches.round, nextRound)),
                 orderBy: (m, { asc }) => [asc(m.id)]
               });

               const nextMatch = nextRoundMatches[nextMatchIndex];
               if (nextMatch) {
                 await tx.update(matches)
                   .set(isHome ? { homeRegistrationId: winnerId } : { awayRegistrationId: winnerId })
                   .where(eq(matches.id, nextMatch.id));
                 
                 // If the next match now has both teams and it was a BYE slot (unlikely but possible), 
                 // we would handle recursive progression, but the user will finish matches manually mostly.
               }
             }
          }
        }
      }
    });

    revalidatePath(`/dashboard/competitions/${match.competitionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Update Match Status Error:', err);
    return { success: false, error: err.message };
  }
}

