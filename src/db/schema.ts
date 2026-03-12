import { mysqlTable, serial, varchar, text, timestamp, json, boolean, int } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 100 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  location: varchar('location', { length: 255 }),
  birthDate: timestamp('birth_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const modalities = mysqlTable('modalities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // Futebol, CS2, etc
  description: text('description'),
});

export const clubs = mysqlTable('clubs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  tag: varchar('tag', { length: 5 }).notNull(), // Ex: ATH
  logoUrl: varchar('logo_url', { length: 500 }),
  location: varchar('location', { length: 255 }),
  presidentId: int('president_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const competitions = mysqlTable('competitions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  modalityId: int('modality_id').references(() => modalities.id),
  organizerId: int('organizer_id').references(() => users.id),
  rulesJson: json('rules_json'), // JSONB para regras flexíveis
  status: varchar('status', { length: 50 }).default('planned'), // planned, active, finished
  createdAt: timestamp('created_at').defaultNow(),
});
