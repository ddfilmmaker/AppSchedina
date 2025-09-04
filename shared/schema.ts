import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nickname: text("nickname").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leagues = pgTable("leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leagueMembers = pgTable("league_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const matchdays = pgTable("matchdays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  name: text("name").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchdayId: varchar("matchday_id").references(() => matchdays.id).notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  kickoff: timestamp("kickoff").notNull(),
  deadline: timestamp("deadline").notNull(),
  result: text("result"), // "1", "X", "2", or null if not finished
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const picks = pgTable("picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pick: text("pick").notNull(), // "1", "X", or "2"
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

export const specialTournaments = pgTable("special_tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "preseason", "supercoppa", "coppa_italia"
  deadline: timestamp("deadline").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  points: integer("points").notNull(),
  description: text("description").notNull(),
});

export const specialBets = pgTable("special_bets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").references(() => specialTournaments.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  prediction: text("prediction").notNull(),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const preSeasonPredictions = pgTable("pre_season_predictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  winner: text("winner").notNull(),
  topScorer: text("top_scorer").notNull(),
  relegated: text("relegated").notNull(),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const preseasonBets = pgTable("preseason_bet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  winner: text("winner").notNull(),
  bottom: text("bottom").notNull(),
  topScorer: text("top_scorer").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  unq: sql`unique(${table.leagueId}, ${table.userId})`
}));

export const preseasonSettings = pgTable("preseason_settings", {
  leagueId: varchar("league_id").primaryKey().references(() => leagues.id).notNull(),
  lockAt: timestamp("lock_at").notNull(),
  locked: boolean("locked").default(false).notNull(),
  winnerOfficial: text("winner_official"),
  bottomOfficial: text("bottom_official"),
  topScorerOfficial: text("top_scorer_official"),
  resultsConfirmedAt: timestamp("results_confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supercoppaSettings = pgTable("supercoppa_settings", {
  leagueId: varchar("league_id").primaryKey().references(() => leagues.id).notNull(),
  lockAt: timestamp("lock_at").notNull(),
  locked: boolean("locked").default(false).notNull(),
  officialFinalist1: text("official_finalist1"),
  officialFinalist2: text("official_finalist2"),
  officialWinner: text("official_winner"),
  resultsConfirmedAt: timestamp("results_confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supercoppaBegs = pgTable("supercoppa_bet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  finalist1: text("finalist1").notNull(),
  finalist2: text("finalist2").notNull(),
  winner: text("winner").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  unq: sql`unique(${table.leagueId}, ${table.userId})`
}));

export const coppaSettings = pgTable("coppa_settings", {
  leagueId: varchar("league_id").primaryKey().references(() => leagues.id).notNull(),
  lockAt: timestamp("lock_at").notNull(),
  locked: boolean("locked").default(false).notNull(),
  officialWinner: text("official_winner"),
  resultsConfirmedAt: timestamp("results_confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coppaBets = pgTable("coppa_bet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  winner: text("winner").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  unq: sql`unique(${table.leagueId}, ${table.userId})`
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLeagueSchema = createInsertSchema(leagues).omit({
  id: true,
  code: true,
  adminId: true,
  createdAt: true,
});

export const insertMatchdaySchema = createInsertSchema(matchdays).omit({
  id: true,
  leagueId: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  matchdayId: true,
  kickoff: true,
}).extend({
  deadline: z.string().datetime().transform(val => new Date(val)),
});

export const insertPickSchema = createInsertSchema(picks).omit({
  id: true,
  submittedAt: true,
  lastModified: true,
});

export const insertSpecialBetSchema = createInsertSchema(specialBets).omit({
  id: true,
  submittedAt: true,
  lastModified: true,
});

export const insertSpecialTournamentSchema = createInsertSchema(specialTournaments).omit({
  id: true,
  leagueId: true,
}).extend({
  deadline: z.string().datetime().transform(val => new Date(val)),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leagues.$inferSelect;
export type LeagueMember = typeof leagueMembers.$inferSelect;
export type InsertMatchday = z.infer<typeof insertMatchdaySchema>;
export type Matchday = typeof matchdays.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertPick = z.infer<typeof insertPickSchema>;
export type Pick = typeof picks.$inferSelect;
export type SpecialTournament = typeof specialTournaments.$inferSelect;
export type InsertSpecialBet = z.infer<typeof insertSpecialBetSchema>;
export type SpecialBet = typeof specialBets.$inferSelect;

// Additional schemas for API validation
export const loginSchema = z.object({
  nickname: z.string().min(1),
  password: z.string().min(1),
});

export const joinLeagueSchema = z.object({
  code: z.string().min(1),
});

export const pickUpdateSchema = z.object({
  matchId: z.string(),
  pick: z.enum(["1", "X", "2"]),
});

export const preseasonBetSchema = z.object({
  winner: z.string().min(1),
  bottom: z.string().min(1),
  topScorer: z.string().min(1),
});

export const preseasonSettingsSchema = z.object({
  lockAt: z.string().datetime().transform(val => new Date(val)),
});

export const preseasonResultsSchema = z.object({
  winnerOfficial: z.string().min(1),
  bottomOfficial: z.string().min(1),
  topScorerOfficial: z.string().min(1),
});

export const supercoppaSettingsSchema = z.object({
  lockAt: z.string().datetime().transform(val => new Date(val)),
});

export const supercoppaResultsSchema = z.object({
  officialFinalist1: z.string().min(1),
  officialFinalist2: z.string().min(1),
  officialWinner: z.string().min(1),
});

export const supercoppaBetSchema = z.object({
  finalist1: z.string().min(1),
  finalist2: z.string().min(1),
  winner: z.string().min(1),
});

export const coppaSettingsSchema = z.object({
  lockAt: z.string().datetime().transform(val => new Date(val)),
});

export const coppaResultsSchema = z.object({
  officialWinner: z.string().min(1),
});

export const coppaBetSchema = z.object({
  winner: z.string().min(1),
});