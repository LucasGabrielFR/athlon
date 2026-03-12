import { mysqlTable, serial, varchar, text, timestamp, json, boolean, int, bigint } from 'drizzle-orm/mysql-core';

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
