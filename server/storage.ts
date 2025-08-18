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
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  constructor() {
    // Removed initialization of global special tournaments as they are now league-specific.
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

  async getAllPicksForMatchday(matchdayId: string): Promise<Array<{ user: User; pick: Pick; matchId: string }>> {
    const matchdayMatches = await this.getMatchdayMatches(matchdayId);
    const matchIds = matchdayMatches.map(m => m.id);

    const picks = Array.from(this.picks.values())
      .filter(pick => matchIds.includes(pick.matchId));

    return picks.map(pick => ({
      user: this.users.get(pick.userId)!,
      pick: pick,
      matchId: pick.matchId
    })).filter(p => p.user);
  }

  async getLeagueLeaderboard(leagueId: string): Promise<{ user: User; points: number; correctPicks: number }[]> {
    const members = await this.getLeagueMembers(leagueId);
    const matchdays = await this.getLeagueMatchdays(leagueId);
    
    const leaderboard = await Promise.all(
      members.map(async (member) => {
        let totalPoints = 0;
        let correctPicks = 0;
        
        for (const matchday of matchdays) {
          const matches = await this.getMatchdayMatches(matchday.id);
          const userPicks = await this.getUserPicks(member.userId, matchday.id);
          
          for (const pick of userPicks) {
            const match = matches.find(m => m.id === pick.matchId);
            if (match?.result && pick.pick === match.result) {
              totalPoints += 3;
              correctPicks += 1;
            }
          }
        }
        
        return {
          user: member.user,
          points: totalPoints,
          correctPicks
        };
      })
    );
    
    return leaderboard.sort((a, b) => b.points - a.points);
  }
}

export const storage = new MemStorage();
