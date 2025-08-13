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
  type InsertSpecialBet
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByNickname(nickname: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leagues
  createLeague(league: InsertLeague): Promise<League>;
  getLeague(id: string): Promise<League | undefined>;
  getLeagueByCode(code: string): Promise<League | undefined>;
  getUserLeagues(userId: string): Promise<(League & { memberCount: number; userPosition: number; userPoints: number })[]>;
  
  // League Members
  joinLeague(leagueId: string, userId: string): Promise<LeagueMember>;
  getLeagueMembers(leagueId: string): Promise<(LeagueMember & { user: User })[]>;
  isUserInLeague(leagueId: string, userId: string): Promise<boolean>;
  
  // Matchdays
  createMatchday(matchday: InsertMatchday): Promise<Matchday>;
  getLeagueMatchdays(leagueId: string): Promise<Matchday[]>;
  getMatchday(id: string): Promise<Matchday | undefined>;
  
  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchdayMatches(matchdayId: string): Promise<Match[]>;
  updateMatchResult(matchId: string, result: string): Promise<Match | undefined>;
  
  // Picks
  submitPick(pick: InsertPick): Promise<Pick>;
  getUserPicks(userId: string, matchdayId: string): Promise<Pick[]>;
  getAllPicksForMatchday(matchdayId: string): Promise<(Pick & { user: User })[]>;
  
  // Special Tournaments
  getSpecialTournaments(): Promise<SpecialTournament[]>;
  submitSpecialBet(bet: InsertSpecialBet): Promise<SpecialBet>;
  getUserSpecialBets(userId: string): Promise<(SpecialBet & { tournament: SpecialTournament })[]>;
  
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

  constructor() {
    this.initializeSpecialTournaments();
  }

  private initializeSpecialTournaments() {
    const tournaments: SpecialTournament[] = [
      {
        id: "preseason-2024",
        name: "Pronostici Pre-Stagione",
        type: "preseason",
        deadline: new Date("2024-08-20T12:00:00Z"),
        isActive: true,
        points: 10,
        description: "Vincitore Serie A (+10), Ultimo posto (+5), Capocannoniere (+5)"
      },
      {
        id: "supercoppa-2024",
        name: "Supercoppa Italiana",
        type: "supercoppa",
        deadline: new Date("2024-01-15T12:00:00Z"),
        isActive: false,
        points: 5,
        description: "Finalisti (+5) e Vincitore (+5)"
      },
      {
        id: "coppa-italia-2024",
        name: "Coppa Italia",
        type: "coppa_italia",
        deadline: new Date("2024-05-15T12:00:00Z"),
        isActive: true,
        points: 5,
        description: "Vincitore della Finale (+5)"
      }
    ];

    tournaments.forEach(t => this.specialTournaments.set(t.id, t));
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

  async createLeague(insertLeague: InsertLeague): Promise<League> {
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

  async createMatchday(insertMatchday: InsertMatchday): Promise<Matchday> {
    const id = randomUUID();
    const matchday: Matchday = {
      ...insertMatchday,
      id,
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

  async getAllPicksForMatchday(matchdayId: string): Promise<(Pick & { user: User })[]> {
    const matchdayMatches = await this.getMatchdayMatches(matchdayId);
    const matchIds = matchdayMatches.map(m => m.id);
    
    const picks = Array.from(this.picks.values())
      .filter(pick => matchIds.includes(pick.matchId));
    
    return picks.map(pick => ({
      ...pick,
      user: this.users.get(pick.userId)!
    })).filter(p => p.user);
  }

  async getSpecialTournaments(): Promise<SpecialTournament[]> {
    return Array.from(this.specialTournaments.values());
  }

  async submitSpecialBet(insertBet: InsertSpecialBet): Promise<SpecialBet> {
    // Check if bet already exists for this user/tournament
    const existingBet = Array.from(this.specialBets.values())
      .find(bet => bet.tournamentId === insertBet.tournamentId && bet.userId === insertBet.userId);
    
    if (existingBet) {
      // Update existing bet
      const updatedBet: SpecialBet = {
        ...existingBet,
        prediction: insertBet.prediction,
        lastModified: new Date(),
      };
      this.specialBets.set(existingBet.id, updatedBet);
      return updatedBet;
    } else {
      // Create new bet
      const id = randomUUID();
      const bet: SpecialBet = {
        ...insertBet,
        id,
        submittedAt: new Date(),
        lastModified: new Date(),
      };
      this.specialBets.set(id, bet);
      return bet;
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

  async getLeagueLeaderboard(leagueId: string): Promise<{ user: User; points: number; correctPicks: number }[]> {
    const members = await this.getLeagueMembers(leagueId);
    const matchdays = await this.getLeagueMatchdays(leagueId);
    
    const leaderboard = members.map(member => {
      let points = 0;
      let correctPicks = 0;
      
      for (const matchday of matchdays) {
        if (!matchday.isCompleted) continue;
        
        const matches = Array.from(this.matches.values())
          .filter(match => match.matchdayId === matchday.id);
        
        for (const match of matches) {
          if (!match.result) continue;
          
          const pick = Array.from(this.picks.values())
            .find(p => p.matchId === match.id && p.userId === member.userId);
          
          if (pick && pick.pick === match.result) {
            points += 1;
            correctPicks += 1;
          }
        }
      }
      
      return {
        user: member.user,
        points,
        correctPicks
      };
    });
    
    return leaderboard.sort((a, b) => b.points - a.points);
  }
}

export const storage = new MemStorage();
