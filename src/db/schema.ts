import { mysqlTable, serial, varchar, text, timestamp, json, boolean, int, bigint } from 'drizzle-orm/mysql-core';
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
  role: varchar('role', { length: 50 }).notNull().default('player'), // player | club_president | league_president | admin
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
  presidentId: bigint('president_id', { mode: 'number', unsigned: true }).references(() => users.id),
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
  modalityId: bigint('modality_id', { mode: 'number', unsigned: true }).references(() => modalities.id),
  organizerId: bigint('organizer_id', { mode: 'number', unsigned: true }).references(() => users.id),
  rulesJson: json('rules_json'),
  format: varchar('format', { length: 50 }).notNull().default('round_robin'),
  isPrivate: boolean('is_private').notNull().default(false),
  entryFee: int('entry_fee').default(0),
  prizePool: int('prize_pool').default(0),
  status: varchar('status', { length: 50 }).default('planned'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

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
  positionId: bigint('position_id', { mode: 'number', unsigned: true }).references(() => positions.id),
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
}));
