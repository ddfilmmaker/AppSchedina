import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nickname: text("nickname").notNull().unique(),
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
  deadline: timestamp("deadline").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchdayId: varchar("matchday_id").references(() => matchdays.id).notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  kickoff: timestamp("kickoff").notNull(),
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
  name: text("name").notNull(),
  type: text("type").notNull(), // "preseason", "supercoppa", "coppa_italia"
  deadline: timestamp("deadline").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  points: integer("points").notNull(),
  description: text("description").notNull(),
});

export const specialBets = pgTable("special_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => specialTournaments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  prediction: text("prediction").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

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
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
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
