import {
  type User,
  type InsertUser,
  type League,
  type InsertLeague,
  type LeagueMember,
  type Matchday,
  type InsertMatchday,
  type Match,
  type InsertMatch,
  type Pick,
  type InsertPick,
  type SpecialTournament,
  type SpecialBet,
  type InsertSpecialBet,
  type PreSeasonPrediction,
  type InsertPreSeasonPrediction,
  type PreSeasonSetting
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, and, asc, desc, sql } from "drizzle-orm"; // Added for potential future use and clarity

// Mock db and schema imports for standalone execution if necessary.
// In a real project, these would be properly imported.
// const db = {}; // Placeholder
// const users = {}; // Placeholder
// const leagues = {}; // Placeholder
// const leagueMembers = {}; // Placeholder
// const matchdays = {}; // Placeholder
// const matches = {}; // Placeholder
// const picks = {}; // Placeholder
// const specialTournaments = {}; // Placeholder
// const specialBets = {}; // Placeholder
// const preSeasonPredictions = {}; // Placeholder
// const preseasonSettings = {}; // Placeholder


// Assuming direct access to db object and schema objects for simplicity in this mock.
// In a real Drizzle setup, you'd import these from your schema definition.
// For this example, we'll simulate the DB and schema objects.

// Mock schema objects (replace with actual imports from @shared/schema)
const users = { id: "users.id", nickname: "users.nickname" } as any;
const leagues = { id: "leagues.id", code: "leagues.code" } as any;
const leagueMembers = { id: "leagueMembers.id", leagueId: "leagueMembers.leagueId", userId: "leagueMembers.userId" } as any;
const matchdays = { id: "matchdays.id", leagueId: "matchdays.leagueId", deadline: "matchdays.deadline" } as any;
const matches = { id: "matches.id", matchdayId: "matches.matchdayId", result: "matches.result", kickoff: "matches.kickoff" } as any;
const picks = { id: "picks.id", userId: "picks.userId", matchId: "picks.matchId", pick: "picks.pick" } as any;
const specialTournaments = { id: "specialTournaments.id", leagueId: "specialTournaments.leagueId", name: "specialTournaments.name" } as any;
const specialBets = { id: "specialBets.id", userId: "specialBets.userId", tournamentId: "specialTournaments.id", prediction: "specialBets.prediction", points: "specialBets.points" } as any;
const preSeasonPredictions = { id: "preSeasonPredictions.id", leagueId: "preSeasonPredictions.leagueId", userId: "preSeasonPredictions.userId", winner: "preSeasonPredictions.winner", bottom: "preSeasonPredictions.bottom", topScorer: "preSeasonPredictions.topScorer", updatedAt: "preSeasonPredictions.updatedAt" } as any;
const preseasonSettings = { leagueId: "preseasonSettings.leagueId", lockAt: "preseasonSettings.lockAt", locked: "preseasonSettings.locked", winnerOfficial: "preseasonSettings.winnerOfficial", bottomOfficial: "preseasonSettings.bottomOfficial", topScorerOfficial: "preseasonSettings.topScorerOfficial", resultsConfirmedAt: "preseasonSettings.resultsConfirmedAt", lockedAt: "preseasonSettings.lockedAt", updatedAt: "preseasonSettings.updatedAt" } as any;

// Mock db object (replace with actual db import)
const db = {
  insert: (table: any) => ({
    values: (data: any) => ({
      onConflictDoUpdate: ({ target, set }: { target: any; set: any }) => ({
        execute: () => Promise.resolve({ rows: [] }) // Mock execute method
      }),
      execute: () => Promise.resolve({ rows: [] }) // Mock execute method
    })
  }),
  select: (config?: any) => ({
    from: (table: any) => ({
      leftJoin: (otherTable: any, condition: any) => ({
        where: (condition: any) => ({
          execute: () => Promise.resolve([]) // Mock execute method
        })
      }),
      where: (condition: any) => ({
        limit: (count: number) => ({
          execute: () => Promise.resolve([]) // Mock execute method
        }),
        execute: () => Promise.resolve([]) // Mock execute method
      }),
      execute: () => Promise.resolve([]) // Mock execute method
    })
  }),
  update: (table: any) => ({
    set: (data: any) => ({
      where: (condition: any) => ({
        execute: () => Promise.resolve({ rows: [] }) // Mock execute method
      })
    })
  })
} as any;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByNickname(nickname: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Leagues
  createLeague(league: InsertLeague & { adminId: string }): Promise<League>;
  getLeague(id: string): Promise<League | undefined>;
  getLeagueByCode(code: string): Promise<League | undefined>;
  getUserLeagues(userId: string): Promise<(League & { memberCount: number; userPosition: number; userPoints: number })[]>;

  // League Members
  joinLeague(leagueId: string, userId: string): Promise<LeagueMember>;
  getLeagueMembers(leagueId: string): Promise<(LeagueMember & { user: User })[]>;
  isUserInLeague(leagueId: string, userId: string): Promise<boolean>;

  // Matchdays
  createMatchday(matchday: InsertMatchday, leagueId: string): Promise<Matchday>;
  getLeagueMatchdays(leagueId: string): Promise<Matchday[]>;
  getMatchday(id: string): Promise<Matchday | undefined>;

  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchdayMatches(matchdayId: string): Promise<Match[]>;
  updateMatchResult(matchId: string, result: string): Promise<Match | undefined>;
  getMatchById(matchId: string): Promise<Match | undefined>;
  getMatchDetails(matchId: string, matchdayId: string): Promise<{
    picks: { userId: string; value: string }[];
    matchdayTotals: { userId: string; points: number }[];
  }>;

  // Picks
  submitPick(pick: InsertPick): Promise<Pick>;
  getUserPicks(userId: string, matchdayId: string): Promise<Pick[]>;
  getAllPicksForMatchday(matchdayId: string): Promise<Array<{ user: User; pick: Pick; matchId: string }>>;

  // Special Tournaments
  getSpecialTournaments(): Promise<SpecialTournament[]>;
  getLeagueSpecialTournaments(leagueId: string): Promise<SpecialTournament[]>;
  createSpecialTournament(tournament: Omit<SpecialTournament, 'id'>, leagueId: string): Promise<SpecialTournament>;
  submitSpecialBet(bet: InsertSpecialBet): Promise<SpecialBet>;
  getUserSpecialBets(userId: string): Promise<(SpecialBet & { tournament: SpecialTournament })[]>;
  getLeagueUserSpecialBets(userId: string, leagueId: string): Promise<(SpecialBet & { tournament: SpecialTournament })[]>;
  getAllSpecialTournamentBets(tournamentId: string): Promise<(SpecialBet & { user: User; tournament: SpecialTournament })[]>;

  // Preseason Bets & Settings
  upsertPreseasonBet(data: InsertPreSeasonPrediction): Promise<any>;
  getPreseasonBet(leagueId: string, userId: string): Promise<PreSeasonPrediction | null>;
  getPreseasonPredictionsForLeague(leagueId: string): Promise<(PreSeasonPrediction & { user: User })[]>;
  getPreseasonSettings(leagueId: string): Promise<PreSeasonSetting | null>;
  updatePreseasonSettings(leagueId: string, settings: Partial<PreSeasonSetting>): Promise<void>;
  lockPreseason(leagueId: string): Promise<void>;
  setPreseasonOfficialResults(leagueId: string, results: { winnerOfficial: string; bottomOfficial: string; topScorerOfficial: string }): Promise<void>;
  computePreseasonPoints(leagueId: string): Promise<void>;


  // Leaderboard
  getLeagueLeaderboard(leagueId: string): Promise<{ user: User; points: number; correctPicks: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private leagues: Map<string, League> = new Map();
  private leagueMembers: Map<string, LeagueMember> = new Map();
  private matchdays: Map<string, Matchday> = new Map();
  private matches: Map<string, Match> = new Map();
  private picks: Map<string, Pick> = new Map();
  private specialTournaments: Map<string, SpecialTournament> = new Map();
  private specialBets: Map<string, SpecialBet> = new Map();
  // In-memory storage for preseason bets and settings
  private preseasonBets: Map<string, InsertPreSeasonPrediction> = new Map(); // Key: `${leagueId}-${userId}`
  private preseasonSettings: Map<string, PreSeasonSetting> = new Map(); // Key: leagueId

  constructor() {
    // Removed initialization of global special tournaments as they are now league-specific.
    // this.initializeSpecialTournaments();
    this.initializeSampleUsers();
  }

  private async initializeSampleUsers() {
    // Add some sample users for testing
    const bcrypt = await import("bcryptjs");

    const testUser = {
      id: "test-user-1",
      nickname: "test",
      password: await bcrypt.hash("test", 10),
      isAdmin: true
    };

    this.users.set(testUser.id, testUser);
  }

  // Removed initializeSpecialTournaments as it's no longer needed globally

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.nickname === nickname);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      isAdmin: insertUser.isAdmin ?? false,
    };
    this.users.set(id, user);
    return user;
  }

  async createLeague(insertLeague: InsertLeague & { adminId: string }): Promise<League> {
    const id = randomUUID();
    const code = this.generateCode();
    const league: League = {
      ...insertLeague,
      id,
      code,
      createdAt: new Date(),
    };
    this.leagues.set(id, league);

    // Auto-join the creator
    await this.joinLeague(id, insertLeague.adminId);

    // Create default special tournaments for the league
    await this.createDefaultSpecialTournaments(id);

    // Initialize preseason settings for the new league
    await this.initializePreseasonSettings(id);

    return league;
  }

  async getLeague(id: string): Promise<League | undefined> {
    return this.leagues.get(id);
  }

  async getLeagueByCode(code: string): Promise<League | undefined> {
    return Array.from(this.leagues.values()).find(league => league.code === code);
  }

  async getUserLeagues(userId: string): Promise<(League & { memberCount: number; userPosition: number; userPoints: number })[]> {
    const userMemberships = Array.from(this.leagueMembers.values())
      .filter(member => member.userId === userId);

    const result = [];

    for (const membership of userMemberships) {
      const league = this.leagues.get(membership.leagueId);
      if (!league) continue;

      const memberCount = Array.from(this.leagueMembers.values())
        .filter(m => m.leagueId === membership.leagueId).length;

      const leaderboard = await this.getLeagueLeaderboard(membership.leagueId);
      const userEntry = leaderboard.find(entry => entry.user.id === userId);
      const userPosition = leaderboard.findIndex(entry => entry.user.id === userId) + 1;

      result.push({
        ...league,
        memberCount,
        userPosition,
        userPoints: userEntry?.points || 0
      });
    }

    return result;
  }

  async joinLeague(leagueId: string, userId: string): Promise<LeagueMember> {
    const id = randomUUID();
    const member: LeagueMember = {
      id,
      leagueId,
      userId,
      joinedAt: new Date(),
    };
    this.leagueMembers.set(id, member);
    return member;
  }

  async getLeagueMembers(leagueId: string): Promise<(LeagueMember & { user: User })[]> {
    const members = Array.from(this.leagueMembers.values())
      .filter(member => member.leagueId === leagueId);

    return members.map(member => ({
      ...member,
      user: this.users.get(member.userId)!
    })).filter(m => m.user);
  }

  async isUserInLeague(leagueId: string, userId: string): Promise<boolean> {
    return Array.from(this.leagueMembers.values())
      .some(member => member.leagueId === leagueId && member.userId === userId);
  }

  async createMatchday(insertMatchday: InsertMatchday, leagueId: string): Promise<Matchday> {
    const id = randomUUID();
    const matchday: Matchday = {
      ...insertMatchday,
      id,
      leagueId,
      createdAt: new Date(),
      isCompleted: insertMatchday.isCompleted ?? false,
    };
    this.matchdays.set(id, matchday);
    return matchday;
  }

  async getLeagueMatchdays(leagueId: string): Promise<Matchday[]> {
    return Array.from(this.matchdays.values())
      .filter(matchday => matchday.leagueId === leagueId)
      .sort((a, b) => b.deadline.getTime() - a.deadline.getTime());
  }

  async getMatchday(id: string): Promise<Matchday | undefined> {
    return this.matchdays.get(id);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const match: Match = {
      ...insertMatch,
      id,
      createdAt: new Date(),
      result: insertMatch.result ?? null,
    };
    this.matches.set(id, match);
    return match;
  }

  async getMatchdayMatches(matchdayId: string): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.matchdayId === matchdayId)
      .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  }

  async updateMatchResult(matchId: string, result: string): Promise<Match | undefined> {
    const match = this.matches.get(matchId);
    if (!match) return undefined;

    const updatedMatch = { ...match, result };
    this.matches.set(matchId, updatedMatch);
    return updatedMatch;
  }

  async getMatchById(matchId: string): Promise<Match | undefined> {
    return this.matches.get(matchId);
  }

  async getMatchDetails(matchId: string, matchdayId: string): Promise<{
    picks: { userId: string; value: string }[];
    matchdayTotals: { userId: string; points: number }[];
  }> {
    // Get picks for this specific match
    const matchPicks = Array.from(this.picks.values())
      .filter(pick => pick.matchId === matchId)
      .map(pick => ({ userId: pick.userId, value: pick.pick }));

    // Get all matches in this matchday
    const matchdayMatches = await this.getMatchdayMatches(matchdayId);

    // Calculate matchday totals for each user
    const matchday = await this.getMatchday(matchdayId);
    if (!matchday) return { picks: matchPicks, matchdayTotals: [] };

    const members = await this.getLeagueMembers(matchday.leagueId);
    const matchdayTotals = members.map(member => {
      let points = 0;

      for (const match of matchdayMatches) {
        if (!match.result) continue;

        const pick = Array.from(this.picks.values())
          .find(p => p.matchId === match.id && p.userId === member.userId);

        if (pick && pick.pick === match.result) {
          points += 1;
        }
      }

      return { userId: member.userId, points };
    });

    return { picks: matchPicks, matchdayTotals };
  }

  async submitPick(insertPick: InsertPick): Promise<Pick> {
    // Check if pick already exists for this user/match
    const existingPick = Array.from(this.picks.values())
      .find(pick => pick.matchId === insertPick.matchId && pick.userId === insertPick.userId);

    if (existingPick) {
      // Update existing pick
      const updatedPick: Pick = {
        ...existingPick,
        pick: insertPick.pick,
        lastModified: new Date(),
      };
      this.picks.set(existingPick.id, updatedPick);
      return updatedPick;
    } else {
      // Create new pick
      const id = randomUUID();
      const pick: Pick = {
        ...insertPick,
        id,
        submittedAt: new Date(),
        lastModified: new Date(),
      };
      this.picks.set(id, pick);
      return pick;
    }
  }

  async getUserPicks(userId: string, matchdayId: string): Promise<Pick[]> {
    const matchdayMatches = await this.getMatchdayMatches(matchdayId);
    const matchIds = matchdayMatches.map(m => m.id);

    return Array.from(this.picks.values())
      .filter(pick => pick.userId === userId && matchIds.includes(pick.matchId));
  }

  async getAllPicksForMatchday(matchdayId: string): Promise<any[]> {
    const matchdayMatches = await this.getMatchdayMatches(matchdayId);
    const matchIds = matchdayMatches.map(m => m.id);

    const picks = Array.from(this.picks.values())
      .filter(pick => matchIds.includes(pick.matchId));

    // Return picks with user information in the format expected by the client
    const allPicks = [];
    for (const pick of picks) {
      const user = this.users.get(pick.userId);
      if (user) {
        allPicks.push({
          user: { id: user.id, nickname: user.nickname },
          pick: { pick: pick.pick },
          matchId: pick.matchId
        });
      }
    }

    return allPicks;
  }

  async getSpecialTournaments(): Promise<SpecialTournament[]> {
    return Array.from(this.specialTournaments.values());
  }

  async getLeagueSpecialTournaments(leagueId: string): Promise<SpecialTournament[]>{
    return Array.from(this.specialTournaments.values())
      .filter(tournament => tournament.leagueId === leagueId);
  }

  async createSpecialTournament(tournament: Omit<SpecialTournament, 'id'>, leagueId: string): Promise<SpecialTournament> {
    const id = randomUUID();
    const newTournament: SpecialTournament = {
      ...tournament,
      id,
      leagueId,
    };

    this.specialTournaments.set(id, newTournament);
    return newTournament;
  }

  async submitSpecialBet(bet: InsertSpecialBet): Promise<SpecialBet> {
    // Check if bet already exists for this user/tournament
    const existingBet = Array.from(this.specialBets.values())
      .find(b => b.tournamentId === bet.tournamentId && b.userId === bet.userId);

    if (existingBet) {
      // Update existing bet
      const updatedBet: SpecialBet = {
        ...existingBet,
        prediction: bet.prediction,
        lastModified: new Date(),
      };
      this.specialBets.set(existingBet.id, updatedBet);
      return updatedBet;
    } else {
      // Create new bet
      const id = randomUUID();
      const newBet: SpecialBet = {
        ...bet,
        id,
        submittedAt: new Date(),
        lastModified: new Date(),
      };
      this.specialBets.set(id, newBet);
      return newBet;
    }
  }

  async getUserSpecialBets(userId: string): Promise<(SpecialBet & { tournament: SpecialTournament })[]> {
    const bets = Array.from(this.specialBets.values())
      .filter(bet => bet.userId === userId);

    return bets.map(bet => ({
      ...bet,
      tournament: this.specialTournaments.get(bet.tournamentId)!
    })).filter(b => b.tournament);
  }

  async getLeagueUserSpecialBets(userId: string, leagueId: string): Promise<(SpecialBet & { tournament: SpecialTournament })[]> {
    const bets = Array.from(this.specialBets.values())
      .filter(bet => bet.userId === userId);

    const result = bets.map(bet => {
      const tournament = this.specialTournaments.get(bet.tournamentId);
      if (tournament && tournament.leagueId === leagueId) {
        return {
          ...bet,
          tournament,
          special_bets: bet, // Assuming this structure is needed elsewhere
          special_tournaments: tournament // Assuming this structure is needed elsewhere
        };
      }
      return null;
    }).filter(Boolean);

    return result as (SpecialBet & { tournament: SpecialTournament })[];
  }

  async getAllSpecialTournamentBets(tournamentId: string): Promise<any[]> {
    // This method uses Drizzle ORM syntax which is not directly compatible with MemStorage mock.
    // Replicating the logic with in-memory maps.
    const tournament = this.specialTournaments.get(tournamentId);
    if (!tournament) return [];

    const allBets: any[] = [];
    for (const bet of this.specialBets.values()) {
      if (bet.tournamentId === tournamentId) {
        const user = this.users.get(bet.userId);
        if (user) {
          allBets.push({
            id: bet.id,
            prediction: bet.prediction,
            points: bet.points ?? 0, // Assuming points can be null if not calculated yet
            user: {
              id: user.id,
              nickname: user.nickname,
            },
            tournament: {
              id: tournament.id,
              name: tournament.name,
            }
          });
        }
      }
    }
    return allBets;
  }

  async upsertPreseasonBet(data: InsertPreSeasonPrediction): Promise<any> {
    const key = `${data.leagueId}-${data.userId}`;
    this.preseasonBets.set(key, data);
    // In a real DB scenario, this would return inserted/updated row info.
    // For mock, returning the data itself.
    return data;
  }

  async getPreseasonBet(leagueId: string, userId: string): Promise<PreSeasonPrediction | null> {
    const key = `${leagueId}-${userId}`;
    const bet = this.preseasonBets.get(key);
    if (!bet) return null;

    return {
      id: randomUUID(),
      leagueId: bet.leagueId,
      userId: bet.userId,
      winner: bet.winner,
      bottom: bet.bottom,
      topScorer: bet.topScorer,
      submittedAt: new Date(),
      lastModified: new Date()
    };
  }

  async getPreseasonPredictionsForLeague(leagueId: string): Promise<(PreSeasonPrediction & { user: User })[]> {
    const predictions: (PreSeasonPrediction & { user: User })[] = [];
    for (const [key, bet] of this.preseasonBets.entries()) {
      if (key.startsWith(`${leagueId}-`)) {
        const userId = key.split('-')[1];
        const user = this.users.get(userId);
        if (user) {
          predictions.push({ ...bet, user });
        }
      }
    }
    return predictions;
  }

  async getAllPreseasonBets(leagueId: string): Promise<any[]> {
    const bets: any[] = [];
    for (const [key, bet] of this.preseasonBets.entries()) {
      if (key.startsWith(`${leagueId}-`)) {
        // Extract userId by removing the leagueId prefix and the dash
        const userId = key.substring(`${leagueId}-`.length);
        const user = this.users.get(userId);
        if (user) {
          bets.push({
            id: randomUUID(),
            userId: userId,
            userNickname: user.nickname,
            predictions: {
              winner: bet.winner,
              lastPlace: bet.bottom,
              topScorer: bet.topScorer
            },
            submittedAt: new Date(),
            user: { id: user.id, nickname: user.nickname }
          });
        }
      }
    }
    console.log(`getAllPreseasonBets for league ${leagueId}: found ${bets.length} bets`);
    return bets;
  }

  async getPreseasonSettings(leagueId: string): Promise<any | null> {
    const settings = this.preseasonSettings.get(leagueId);
    if (!settings) return null;

    // Auto-lock if deadline has passed
    const now = new Date();
    const lockDate = new Date(settings.lockAt);

    if (settings.lockAt && now > lockDate && !settings.locked) {
      console.log(`Auto-locking preseason for league ${leagueId} - deadline passed. Now: ${now.toISOString()}, Lock date: ${lockDate.toISOString()}`);
      settings.locked = true;
      settings.lockedAt = now;
      settings.updatedAt = now;
      this.preseasonSettings.set(leagueId, settings);
    }

    return settings;
  }

  async upsertPreseasonSettings(leagueId: string, settings: any): Promise<void> {
    const currentSettings = this.preseasonSettings.get(leagueId);
    if (currentSettings) {
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        updatedAt: new Date()
      };
      this.preseasonSettings.set(leagueId, updatedSettings);
      console.log(`Updated preseason settings for league ${leagueId}:`, updatedSettings);
    } else {
      const newSettings = {
        leagueId,
        lockAt: settings.lockAt || null,
        locked: false,
        winnerOfficial: null,
        bottomOfficial: null,
        topScorerOfficial: null,
        resultsConfirmedAt: null,
        lockedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...settings
      };
      this.preseasonSettings.set(leagueId, newSettings);
      console.log(`Created preseason settings for league ${leagueId}:`, newSettings);
    }
  }

  async setPreseasonResults(leagueId: string, results: any): Promise<void> {
    const settings = this.preseasonSettings.get(leagueId);
    if (settings) {
      this.preseasonSettings.set(leagueId, {
        ...settings,
        winnerOfficial: results.winnerOfficial,
        bottomOfficial: results.bottomOfficial,
        topScorerOfficial: results.topScorerOfficial,
        resultsConfirmedAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async updatePreseasonSettings(leagueId: string, settings: Partial<PreSeasonSetting>): Promise<void> {
    const currentSettings = this.preseasonSettings.get(leagueId);
    if (currentSettings) {
      this.preseasonSettings.set(leagueId, { ...currentSettings, ...settings });
    } else {
      // This case should ideally not happen if initializePreseasonSettings is called on league creation
      this.preseasonSettings.set(leagueId, {
        leagueId,
        lockAt: null,
        locked: false,
        winnerOfficial: null,
        bottomOfficial: null,
        topScorerOfficial: null,
        resultsConfirmedAt: null,
        ...settings
      });
    }
  }

  private async initializePreseasonSettings(leagueId: string): Promise<void> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const defaultDeadline = new Date(`${nextYear}-08-20T23:59:59.000Z`);

    this.preseasonSettings.set(leagueId, {
      leagueId,
      lockAt: defaultDeadline,
      locked: false,
      winnerOfficial: null,
      bottomOfficial: null,
      topScorerOfficial: null,
      resultsConfirmedAt: null,
    });
  }

  async lockPreseason(leagueId: string): Promise<void> {
    const settings = this.preseasonSettings.get(leagueId);
    if (settings) {
      settings.locked = true;
      settings.lockedAt = new Date();
      settings.updatedAt = new Date();
      this.preseasonSettings.set(leagueId, settings);
      console.log(`Preseason locked for league ${leagueId} at ${settings.lockedAt}`);
    }
  }

  async setPreseasonOfficialResults(leagueId: string, results: { winnerOfficial: string; bottomOfficial: string; topScorerOfficial: string }): Promise<void> {
    const settings = this.preseasonSettings.get(leagueId);
    if (settings) {
      settings.winnerOfficial = results.winnerOfficial;
      settings.bottomOfficial = results.bottomOfficial;
      settings.topScorerOfficial = results.topScorerOfficial;
      // Mark results as confirmed, which might trigger point calculation
      settings.resultsConfirmedAt = new Date();
      this.preseasonSettings.set(leagueId, settings);
    }
  }

  // Store preseason points separately to integrate with leaderboard
  private preseasonPoints: Map<string, number> = new Map(); // Key: `${leagueId}-${userId}`

  async computePreseasonPoints(leagueId: string): Promise<void> {
    const settings = await this.getPreseasonSettings(leagueId);
    if (!settings || !settings.resultsConfirmedAt || !settings.winnerOfficial || !settings.bottomOfficial || !settings.topScorerOfficial) {
      console.warn(`Cannot compute preseason points for league ${leagueId}: settings or official results not set.`);
      return;
    }

    const leagueMembers = await this.getLeagueMembers(leagueId);

    console.log(`Computing Preseason Points for League: ${leagueId}`);
    console.log(`Official results: Winner=${settings.winnerOfficial}, Bottom=${settings.bottomOfficial}, TopScorer=${settings.topScorerOfficial}`);

    for (const member of leagueMembers) {
      const userBet = await this.getPreseasonBet(leagueId, member.userId);
      if (!userBet) {
        console.log(`No preseason bet found for user ${member.user.nickname} (${member.userId})`);
        continue;
      }

      let points = 0;
      console.log(`Checking predictions for ${member.user.nickname}: Winner=${userBet.winner}, Bottom=${userBet.bottom}, TopScorer=${userBet.topScorer}`);

      if (userBet.winner === settings.winnerOfficial) {
        points += 10;
        console.log(`${member.user.nickname} got winner correct (+10 points)`);
      }
      if (userBet.bottom === settings.bottomOfficial) {
        points += 5;
        console.log(`${member.user.nickname} got bottom correct (+5 points)`);
      }
      if (userBet.topScorer === settings.topScorerOfficial) {
        points += 5;
        console.log(`${member.user.nickname} got top scorer correct (+5 points)`);
      }

      // Store points for leaderboard integration
      const pointsKey = `${leagueId}-${member.userId}`;
      this.preseasonPoints.set(pointsKey, points);

      console.log(`User ${member.user.nickname} (${member.userId}) earned ${points} total preseason points.`);
    }
  }

  async getLeagueLeaderboard(leagueId: string): Promise<{ user: User; points: number; correctPicks: number; preseasonPoints?: number }[]> {
    const members = await this.getLeagueMembers(leagueId);
    const matchdays = await this.getLeagueMatchdays(leagueId);

    const leaderboard = members.map(member => {
      let matchdayPoints = 0;
      let correctPicks = 0;

      // Calculate points from regular matches
      for (const matchday of matchdays) {
        const matches = Array.from(this.matches.values())
          .filter(match => match.matchdayId === matchday.id);

        for (const match of matches) {
          if (!match.result) continue;

          const pick = Array.from(this.picks.values())
            .find(p => p.matchId === match.id && p.userId === member.userId);

          if (pick && pick.pick === match.result) {
            matchdayPoints += 1;
            correctPicks += 1;
          }
        }
      }

      // Add preseason points to total
      const preseasonPointsKey = `${leagueId}-${member.userId}`;
      const preseasonPoints = this.preseasonPoints.get(preseasonPointsKey) || 0;
      const totalPoints = matchdayPoints + preseasonPoints;

      console.log(`Leaderboard calculation for ${member.user.nickname}: matchday points: ${matchdayPoints}, preseason points: ${preseasonPoints}, total: ${totalPoints}`);

      return {
        user: member.user,
        points: totalPoints,
        correctPicks,
        preseasonPoints: preseasonPoints > 0 ? preseasonPoints : undefined
      };
    });

    return leaderboard.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.correctPicks - a.correctPicks;
    });
  }

  private async createDefaultSpecialTournaments(leagueId: string): Promise<void> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Preseason tournament - this setup might be redundant if PreSeasonSettings handles it
    // but keeping it for consistency with other special tournaments.
    const preseasonDeadline = new Date(`${nextYear}-08-20T23:59:59.000Z`);
    await this.createSpecialTournament({
      name: "Pronostici Pre-Stagione",
      type: "preseason",
      deadline: preseasonDeadline,
      isActive: true,
      points: 20, // Points for winning the preseason prediction overall
      description: "Pronostica il vincitore, l'ultimo posto e il capocannoniere della Serie A"
    }, leagueId);

    // Supercoppa tournament
    const supercoppaDeadline = new Date(`${nextYear}-01-05T20:00:00.000Z`);
    await this.createSpecialTournament({
      name: "Supercoppa Italiana",
      type: "supercoppa",
      deadline: supercoppaDeadline,
      isActive: true,
      points: 5,
      description: "Pronostica la vincitrice della Supercoppa Italiana"
    }, leagueId);

    // Coppa Italia tournament
    const coppaDeadline = new Date(`${nextYear}-05-10T20:00:00.000Z`);
    await this.createSpecialTournament({
      name: "Coppa Italia",
      type: "coppa_italia",
      deadline: coppaDeadline,
      isActive: true,
      points: 10,
      description: "Pronostica la vincitrice della Coppa Italia"
    }, leagueId);
  }
}

export const storage = new MemStorage();