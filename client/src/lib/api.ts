import { apiRequest } from "@/lib/queryClient";

export interface League {
  id: string;
  name: string;
  code: string;
  adminId: string;
  memberCount: number;
  userPosition: number;
  userPoints: number;
}

export interface Matchday {
  id: string;
  leagueId: string;
  name: string;
  deadline: string;
  isCompleted: boolean;
}

export interface Match {
  id: string;
  matchdayId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  result?: string;
}

export interface Pick {
  id: string;
  matchId: string;
  userId: string;
  pick: string;
  submittedAt: string;
  lastModified: string;
}

export async function createLeague(name: string): Promise<League> {
  const response = await apiRequest("POST", "/api/leagues", { name });
  return response.json();
}

export async function joinLeague(code: string): Promise<{ success: boolean; league: League }> {
  const response = await apiRequest("POST", "/api/leagues/join", { code });
  return response.json();
}

export async function submitPick(matchId: string, pick: string): Promise<Pick> {
  const response = await apiRequest("POST", "/api/picks", { matchId, pick });
  return response.json();
}

export async function createMatchday(leagueId: string, name: string, deadline: Date): Promise<Matchday> {
  const response = await apiRequest("POST", `/api/leagues/${leagueId}/matchdays`, {
    name,
    deadline: deadline.toISOString(),
    isCompleted: false
  });
  return response.json();
}

export async function createMatch(matchdayId: string, homeTeam: string, awayTeam: string, kickoff: Date): Promise<Match> {
  const response = await apiRequest("POST", `/api/matchdays/${matchdayId}/matches`, {
    homeTeam,
    awayTeam,
    kickoff: kickoff.toISOString()
  });
  return response.json();
}

export async function createMatch(matchdayId: string, homeTeam: string, awayTeam: string, kickoff: Date): Promise<Match> {
  const response = await apiRequest("POST", `/api/matchdays/${matchdayId}/matches`, {
    homeTeam,
    awayTeam,
    kickoff: kickoff.toISOString()
  });
  return response.json();
}
