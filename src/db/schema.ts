import { mysqlTable, serial, varchar, text, timestamp, json, boolean, int, bigint, foreignKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ──────────────────────────────────────────
// USERS & AUTH
// ──────────────────────────────────────────

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 100 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  passwordHash: varchar('password_hash', { length: 255 }),
  image: varchar('image', { length: 500 }),
  role: varchar('role', { length: 50 }).notNull().default('player'), // player | club_president | org_president | admin
  location: varchar('location', { length: 255 }),
  birthDate: timestamp('birth_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Required by Auth.js Drizzle Adapter
export const accounts = mysqlTable('accounts', {
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: int('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
  sessionState: varchar('session_state', { length: 255 }),
});

export const sessions = mysqlTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = mysqlTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
});

// ──────────────────────────────────────────
// MODALITIES
// ──────────────────────────────────────────

export const modalities = mysqlTable('modalities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isTeamBased: boolean('is_team_based').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ──────────────────────────────────────────
// CLUBS
// ──────────────────────────────────────────

export const clubs = mysqlTable('clubs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  tag: varchar('tag', { length: 5 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  location: varchar('location', { length: 255 }),
  presidentId: bigint('president_id', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'cascade' }),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).references(() => modalities.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ──────────────────────────────────────────
// CLUB MEMBERS (elenco aceito)
// ──────────────────────────────────────────

export const clubMembers = mysqlTable('club_members', {
  id: serial('id').primaryKey(),
  clubId: bigint('club_id', { mode: 'number', unsigned: true }).notNull().references(() => clubs.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).notNull().references(() => modalities.id),
  role: varchar('role', { length: 50 }).notNull().default('player'), // player | captain | coach
  joinedAt: timestamp('joined_at').defaultNow(),
});

// ──────────────────────────────────────────
// ORGANIZATIONS (federações)
// ──────────────────────────────────────────

export const organizations = mysqlTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  tag: varchar('tag', { length: 10 }).notNull(),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  presidentId: bigint('president_id', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('active'), // active | deactivated
  createdAt: timestamp('created_at').defaultNow(),
});

// ──────────────────────────────────────────
// CLUB INVITATIONS (convites e pedidos)
// ──────────────────────────────────────────

export const clubInvitations = mysqlTable('club_invitations', {
  id: serial('id').primaryKey(),
  clubId: bigint('club_id', { mode: 'number', unsigned: true }).notNull().references(() => clubs.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).notNull().references(() => modalities.id),
  type: varchar('type', { length: 20 }).notNull(), // 'invite' | 'request'
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'accepted' | 'rejected'
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ──────────────────────────────────────────
// COMPETITIONS
// ──────────────────────────────────────────

export const competitions = mysqlTable('competitions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).references(() => modalities.id, { onDelete: 'cascade' }),
  organizationId: bigint('organization_id', { mode: 'number', unsigned: true }).references(() => organizations.id, { onDelete: 'cascade' }),
  organizerId: bigint('organizer_id', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'cascade' }),
  rulesJson: json('rules_json'),
  format: varchar('format', { length: 50 }).notNull().default('round_robin'),
  isPrivate: boolean('is_private').notNull().default(false),
  entryFee: int('entry_fee').default(0),
  prizePool: int('prize_pool').default(0),
  status: varchar('status', { length: 50 }).default('planned'), // planned | registration | active | finished
  
  // Registration & Roster Limits
  maxTeams: int('max_teams'),
  minPlayersPerTeam: int('min_players_per_team'),
  maxPlayersPerTeam: int('max_players_per_team'),
  registrationStartDate: timestamp('registration_start_date'),
  registrationEndDate: timestamp('registration_end_date'),
  registrationWindows: json('registration_windows'), // Periodos recorrentes de inscrição
  
  isRegistrationManualOpen: boolean('is_registration_manual_open').notNull().default(false),
  isWindowManualOpen: boolean('is_window_manual_open').notNull().default(false),

  // Knockout Settings
  knockoutConfig: json('knockout_config'), // Configurações do mata-mata (matchupFormat, tieBreaker)
  groupsConfig: json('groups_config'), // Configurações de grupos { groupsCount: 2, advancingPerGroup: 2 }


  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ──────────────────────────────────────────
// COMPETITION REGISTRATIONS (clubes inscritos)
// ──────────────────────────────────────────

export const competitionRegistrations = mysqlTable('competition_registrations', {
  id: serial('id').primaryKey(),
  competitionId: bigint('competition_id', { mode: 'number', unsigned: true }).notNull(),
  clubId: bigint('club_id', { mode: 'number', unsigned: true }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | approved | rejected
  groupId: varchar('group_id', { length: 10 }), // ex: 'A', 'B' para grupos_knockout
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  foreignKey({
    name: 'comp_reg_comp_id_fk',
    columns: [table.competitionId],
    foreignColumns: [competitions.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'comp_reg_club_id_fk',
    columns: [table.clubId],
    foreignColumns: [clubs.id],
  }).onDelete('cascade'),
]);

// ──────────────────────────────────────────
// COMPETITION ROSTERS (jogadores inscritos pelo clube)
// ──────────────────────────────────────────

export const competitionRosters = mysqlTable('competition_rosters', {
  id: serial('id').primaryKey(),
  registrationId: bigint('registration_id', { mode: 'number', unsigned: true }).notNull(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  foreignKey({
    name: 'comp_rost_reg_id_fk',
    columns: [table.registrationId],
    foreignColumns: [competitionRegistrations.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'comp_rost_user_id_fk',
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
]);

// ──────────────────────────────────────────
// POSITIONS (por modalidade)
// ──────────────────────────────────────────

export const positions = mysqlTable('positions', {
  id: serial('id').primaryKey(),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).notNull().references(() => modalities.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // ex: Atacante, Mid Laner
  abbreviation: varchar('abbreviation', { length: 10 }), // ex: ATK, MID
  createdAt: timestamp('created_at').defaultNow(),
});

// ──────────────────────────────────────────
// STAT TYPES (dicionário técnico por modalidade)
// ──────────────────────────────────────────

export const statTypes = mysqlTable('stat_types', {
  id: serial('id').primaryKey(),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).notNull().references(() => modalities.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // ex: Gols, Assists, Kills
  unit: varchar('unit', { length: 30 }), // ex: 'pts', 'min', '%'
  isHigherBetter: boolean('is_higher_better').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ──────────────────────────────────────────
// COMPETITION POSTS & FEED
// ──────────────────────────────────────────

export const competitionPosts = mysqlTable('competition_posts', {
  id: serial('id').primaryKey(),
  competitionId: bigint('competition_id', { mode: 'number', unsigned: true }).notNull(),
  authorId: bigint('author_id', { mode: 'number', unsigned: true }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('post'), // 'post' | 'system'
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  foreignKey({
    name: 'comp_posts_comp_id_fk',
    columns: [table.competitionId],
    foreignColumns: [competitions.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'comp_posts_author_id_fk',
    columns: [table.authorId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
]);

// ──────────────────────────────────────────
// MATCHES
// ──────────────────────────────────────────

export const matches = mysqlTable('matches', {
  id: serial('id').primaryKey(),
  competitionId: bigint('competition_id', { mode: 'number', unsigned: true }).notNull(),
  homeRegistrationId: bigint('home_registration_id', { mode: 'number', unsigned: true }),
  awayRegistrationId: bigint('away_registration_id', { mode: 'number', unsigned: true }),
  homeScore: int('home_score').default(0),
  awayScore: int('away_score').default(0),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled | live | finished | canceled
  startTime: timestamp('start_time'),
  round: int('round'),
  stage: varchar('stage', { length: 20 }).notNull().default('regular'), // regular | groups | knockout
  seriesId: varchar('series_id', { length: 50 }), // Para agrupar partidas de ida/volta ou md3
  metadata: json('metadata'), // mod-specific: overtime, etc
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  foreignKey({
    name: 'match_comp_id_fk',
    columns: [table.competitionId],
    foreignColumns: [competitions.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'match_home_reg_id_fk',
    columns: [table.homeRegistrationId],
    foreignColumns: [competitionRegistrations.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'match_away_reg_id_fk',
    columns: [table.awayRegistrationId],
    foreignColumns: [competitionRegistrations.id],
  }).onDelete('cascade'),
]);

// ──────────────────────────────────────────
// MATCH EVENTS
// ──────────────────────────────────────────

export const matchEvents = mysqlTable('match_events', {
  id: serial('id').primaryKey(),
  matchId: bigint('match_id', { mode: 'number', unsigned: true }).notNull(),
  registrationId: bigint('registration_id', { mode: 'number', unsigned: true }).notNull(),
  playerId: bigint('player_id', { mode: 'number', unsigned: true }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // goal, yellow_card, kill, etc
  minute: int('minute'),
  metadata: json('metadata'), // assist_player_id, etc
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  foreignKey({
    name: 'match_evt_match_id_fk',
    columns: [table.matchId],
    foreignColumns: [matches.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'match_evt_player_id_fk',
    columns: [table.playerId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'match_evt_reg_id_fk',
    columns: [table.registrationId],
    foreignColumns: [competitionRegistrations.id],
  }).onDelete('cascade'),
]);


// ──────────────────────────────────────────
// PLAYER PROFILES
// ──────────────────────────────────────────

export const playerProfiles = mysqlTable('player_profiles', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bannerUrl: varchar('banner_url', { length: 500 }),
  activeModalityId: bigint('active_modality_id', { mode: 'number', unsigned: true }).references(() => modalities.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ──────────────────────────────────────────
// PLAYER MODALITIES (jogador ↔ modalidade)
// ──────────────────────────────────────────

export const playerModalities = mysqlTable('player_modalities', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).notNull().references(() => modalities.id, { onDelete: 'cascade' }),
  primaryPositionId: bigint('primary_position_id', { mode: 'number', unsigned: true }).references(() => positions.id),
  secondaryPositionId: bigint('secondary_position_id', { mode: 'number', unsigned: true }).references(() => positions.id),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// ──────────────────────────────────────────
// RELATIONS
// ──────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(clubMembers),
  invitations: many(clubInvitations),
  presidedClubs: many(clubs),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  president: one(users, {
    fields: [clubs.presidentId],
    references: [users.id],
  }),
  modality: one(modalities, {
    fields: [clubs.modalityId],
    references: [modalities.id],
  }),
  members: many(clubMembers),
  invitations: many(clubInvitations),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
  modality: one(modalities, {
    fields: [clubMembers.modalityId],
    references: [modalities.id],
  }),
}));

export const clubInvitationsRelations = relations(clubInvitations, ({ one }) => ({
  club: one(clubs, {
    fields: [clubInvitations.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubInvitations.userId],
    references: [users.id],
  }),
  modality: one(modalities, {
    fields: [clubInvitations.modalityId],
    references: [modalities.id],
  }),
}));

export const modalitiesRelations = relations(modalities, ({ many }) => ({
  members: many(clubMembers),
  invitations: many(clubInvitations),
  competitions: many(competitions),
  positions: many(positions),
  statTypes: many(statTypes),
  clubs: many(clubs),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  president: one(users, {
    fields: [organizations.presidentId],
    references: [users.id],
  }),
  competitions: many(competitions),
}));

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  modality: one(modalities, {
    fields: [competitions.modalityId],
    references: [modalities.id],
  }),
  organization: one(organizations, {
    fields: [competitions.organizationId],
    references: [organizations.id],
  }),
  organizer: one(users, {
    fields: [competitions.organizerId],
    references: [users.id],
  }),
  registrations: many(competitionRegistrations),
  posts: many(competitionPosts),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [matches.competitionId],
    references: [competitions.id],
  }),
  homeRegistration: one(competitionRegistrations, {
    fields: [matches.homeRegistrationId],
    references: [competitionRegistrations.id],
    relationName: 'match_homeRegistration',
  }),
  awayRegistration: one(competitionRegistrations, {
    fields: [matches.awayRegistrationId],
    references: [competitionRegistrations.id],
    relationName: 'match_awayRegistration',
  }),
  events: many(matchEvents),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, {
    fields: [matchEvents.matchId],
    references: [matches.id],
  }),
  registration: one(competitionRegistrations, {
    fields: [matchEvents.registrationId],
    references: [competitionRegistrations.id],
  }),
  player: one(users, {
    fields: [matchEvents.playerId],
    references: [users.id],
  }),
}));


export const competitionRegistrationsRelations = relations(competitionRegistrations, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [competitionRegistrations.competitionId],
    references: [competitions.id],
  }),
  club: one(clubs, {
    fields: [competitionRegistrations.clubId],
    references: [clubs.id],
  }),
  roster: many(competitionRosters),
  homeMatches: many(matches, { relationName: 'match_homeRegistration' }),
  awayMatches: many(matches, { relationName: 'match_awayRegistration' }),
}));

export const competitionPostsRelations = relations(competitionPosts, ({ one }) => ({
  competition: one(competitions, {
    fields: [competitionPosts.competitionId],
    references: [competitions.id],
  }),
  author: one(users, {
    fields: [competitionPosts.authorId],
    references: [users.id],
  }),
}));


export const competitionRostersRelations = relations(competitionRosters, ({ one }) => ({
  registration: one(competitionRegistrations, {
    fields: [competitionRosters.registrationId],
    references: [competitionRegistrations.id],
  }),
  user: one(users, {
    fields: [competitionRosters.userId],
    references: [users.id],
  }),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  modality: one(modalities, {
    fields: [positions.modalityId],
    references: [modalities.id],
  }),
}));

export const playerModalitiesRelations = relations(playerModalities, ({ one }) => ({
  user: one(users, {
    fields: [playerModalities.userId],
    references: [users.id],
  }),
  modality: one(modalities, {
    fields: [playerModalities.modalityId],
    references: [modalities.id],
  }),
  primaryPosition: one(positions, {
    fields: [playerModalities.primaryPositionId],
    references: [positions.id],
  }),
  secondaryPosition: one(positions, {
    fields: [playerModalities.secondaryPositionId],
    references: [positions.id],
  }),
}));

export const statTypesRelations = relations(statTypes, ({ one }) => ({
  modality: one(modalities, {
    fields: [statTypes.modalityId],
    references: [modalities.id],
  }),
}));
