import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  insertLeagueSchema,
  joinLeagueSchema,
  insertMatchdaySchema,
  insertMatchSchema,
  pickUpdateSchema,
  insertSpecialBetSchema,
  insertSpecialTournamentSchema,
  preseasonBetSchema,
  preseasonSettingsSchema,
  preseasonResultsSchema,
  supercoppaBetSchema,
  supercoppaSettingsSchema,
  supercoppaResultsSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { leagueMembers, users, preSeasonPredictions } from "@shared/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration attempt:", req.body);
      const { nickname, password } = insertUserSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByNickname(nickname);
      if (existingUser) {
        console.log("User already exists:", nickname);
        return res.status(400).json({ error: "Il nickname è già in uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        nickname,
        password: hashedPassword,
        isAdmin: false
      });

      console.log("User created:", user.id);
      req.session.userId = user.id;
      res.json({ user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { nickname, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByNickname(nickname);
      console.log("User found:", user ? "yes" : "no");

      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      console.log("Password valid:", validPassword);

      if (!validPassword) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      req.session.userId = user.id;
      console.log("Session created for user:", user.id);
      res.json({ user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Errore durante il logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("Auth check - Session ID:", req.session.userId);
    console.log("Session data:", req.session);

    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const user = await storage.getUser(req.session.userId);
    console.log("User found for session:", user ? "yes" : "no");

    if (!user) {
      return res.status(401).json({ error: "Utente non trovato" });
    }

    res.json({ user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin } });
  });

  // League routes
  app.post("/api/leagues", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { name } = insertLeagueSchema.parse(req.body);
      const league = await storage.createLeague({
        name,
        adminId: req.session.userId
      });
      res.json(league);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.get("/api/leagues", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const leagues = await storage.getUserLeagues(req.session.userId);
    res.json(leagues);
  });

  app.post("/api/leagues/join", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { code } = joinLeagueSchema.parse(req.body);

      const league = await storage.getLeagueByCode(code);
      if (!league) {
        return res.status(404).json({ error: "Codice lega non valido" });
      }

      const alreadyMember = await storage.isUserInLeague(league.id, req.session.userId);
      if (alreadyMember) {
        return res.status(400).json({ error: "Sei già membro di questa lega" });
      }

      await storage.joinLeague(league.id, req.session.userId);
      res.json({ success: true, league });
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.get("/api/leagues/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const league = await storage.getLeague(req.params.id);
    if (!league) {
      return res.status(404).json({ error: "Lega non trovata" });
    }

    const isMember = await storage.isUserInLeague(league.id, req.session.userId);
    if (!isMember) {
      return res.status(403).json({ error: "Non sei membro di questa lega" });
    }

    const members = await storage.getLeagueMembers(league.id);
    const matchdays = await storage.getLeagueMatchdays(league.id);

    res.json({ league, members, matchdays });
  });

  app.get("/api/leagues/:id/leaderboard", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const league = await storage.getLeague(req.params.id);
    if (!league) {
      return res.status(404).json({ error: "Lega non trovata" });
    }

    const isMember = await storage.isUserInLeague(league.id, req.session.userId);
    if (!isMember) {
      return res.status(403).json({ error: "Non sei membro di questa lega" });
    }

    const leaderboard = await storage.getLeagueLeaderboard(league.id);
    res.json(leaderboard);
  });

  // Matchday routes
  app.post("/api/leagues/:leagueId/matchdays", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const league = await storage.getLeague(req.params.leagueId);
    if (!league) {
      return res.status(404).json({ error: "Lega non trovata" });
    }

    if (league.adminId !== req.session.userId) {
      return res.status(403).json({ error: "Solo l'admin può creare giornate" });
    }

    try {
      console.log("Request body:", req.body);
      console.log("League ID:", req.params.leagueId);
      const data = insertMatchdaySchema.parse(req.body);
      console.log("Parsed data:", data);
      const matchday = await storage.createMatchday(data, req.params.leagueId);
      console.log("Created matchday:", matchday);
      res.json(matchday);
    } catch (error) {
      console.error("Matchday creation error:", error);
      if (error instanceof Error && 'issues' in error) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ error: "Dati non validi", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/matchdays/:id/matches", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const matchday = await storage.getMatchday(req.params.id);
      if (!matchday) {
        return res.status(404).json({ error: "Giornata non trovata" });
      }

      const isAdmin = await storage.isUserAdminOfLeague(matchday.leagueId, req.session.userId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Solo l'admin può creare partite" });
      }

      const data = insertMatchSchema.parse({
        ...req.body,
        matchdayId: req.params.id
      });
      
      const match = await storage.createMatch(data);
      res.json(match);
    } catch (error) {
      console.error("Match creation error:", error);
      res.status(400).json({ error: "Dati non validi", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/matchdays/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const matchday = await storage.getMatchday(req.params.id);
    if (!matchday) {
      return res.status(404).json({ error: "Giornata non trovata" });
    }

    const isMember = await storage.isUserInLeague(matchday.leagueId, req.session.userId);
    if (!isMember) {
      return res.status(403).json({ error: "Non sei membro di questa lega" });
    }

    const matches = await storage.getMatchdayMatches(matchday.id);
    const userPicks = await storage.getUserPicks(req.session.userId, matchday.id);

    // Always include all picks since deadline logic is now per-match
    const allPicks = await storage.getAllPicksForMatchday(matchday.id);
    console.log(`Matchday ${matchday.id}. User: ${req.session.userId}. AllPicks count: ${allPicks.length}`);

    res.json({ matchday, matches, userPicks, allPicks });
  });

  // New endpoint for match details with participants data
  app.get("/api/matches/:id/details", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const match = await storage.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: "Partita non trovata" });
    }

    const matchday = await storage.getMatchday(match.matchdayId);
    if (!matchday) {
      return res.status(404).json({ error: "Giornata non trovata" });
    }

    const isMember = await storage.isUserInLeague(matchday.leagueId, req.session.userId);
    if (!isMember) {
      return res.status(403).json({ error: "Non sei membro di questa lega" });
    }

    // Get participants data
    const participants = await storage.getLeagueMembers(matchday.leagueId);
    const matchDetails = await storage.getMatchDetails(req.params.id, matchday.id);

    res.json({
      match,
      matchday,
      participants: participants.map(p => ({ id: p.user.id, nickname: p.user.nickname })),
      pickForThisMatch: matchDetails.picks,
      resultForThisMatch: match.result,
      matchdayTotals: matchDetails.matchdayTotals
    });
  });

  // Match routes
  app.post("/api/matchdays/:matchdayId/matches", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const matchday = await storage.getMatchday(req.params.matchdayId);
    if (!matchday) {
      return res.status(404).json({ error: "Giornata non trovata" });
    }

    const league = await storage.getLeague(matchday.leagueId);
    if (!league || league.adminId !== req.session.userId) {
      return res.status(403).json({ error: "Solo l'admin può aggiungere partite" });
    }

    try {
      console.log("Match creation request body:", req.body);
      console.log("Matchday ID:", req.params.matchdayId);
      const data = insertMatchSchema.parse(req.body);
      console.log("Parsed match data:", data);
      const match = await storage.createMatch({
        ...data,
        matchdayId: req.params.matchdayId
      });
      console.log("Created match:", match);
      res.json(match);
    } catch (error) {
      console.error("Match creation error:", error);
      if (error instanceof Error && 'issues' in error) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ error: "Dati non validi", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/matches/:id/result", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const { result } = req.body;
    if (!["1", "X", "2"].includes(result)) {
      return res.status(400).json({ error: "Risultato non valido" });
    }

    // Check admin permissions - admins can update results at any time
    const user = await storage.getUser(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: "Solo gli admin possono inserire risultati" });
    }

    const match = await storage.updateMatchResult(req.params.id, result);
    if (!match) {
      return res.status(404).json({ error: "Partita non trovata" });
    }

    res.json(match);
  });

  // Pick routes
  app.post("/api/picks", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const data = pickUpdateSchema.parse(req.body);

      // Check if match deadline has passed
      const match = await storage.getMatchById(data.matchId);
      if (!match) {
        return res.status(404).json({ error: "Partita non trovata" });
      }

      const now = new Date();
      if (now > new Date(match.deadline)) {
        return res.status(400).json({ error: "Scadenza per questa partita è già passata" });
      }

      const pick = await storage.submitPick({
        matchId: data.matchId,
        pick: data.pick,
        userId: req.session.userId
      });

      res.json(pick);
    } catch (error) {
      console.error("Pick submission error:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Pre-season predictions routes
  app.get("/api/leagues/:leagueId/pre-season-tournament", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { leagueId } = req.params;

      // Check if user is member of the league
      const membership = await db.select()
        .from(leagueMembers)
        .where(and(
          eq(leagueMembers.leagueId, leagueId),
          eq(leagueMembers.userId, userId)
        ))
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      // Get user's existing prediction
      const userPrediction = await db.select()
        .from(preSeasonPredictions)
        .where(and(
          eq(preSeasonPredictions.leagueId, leagueId),
          eq(preSeasonPredictions.userId, userId)
        ))
        .limit(1);

      // Get all predictions for this league (only after deadline)
      const deadline = new Date("2025-08-17T14:30:00");
      const now = new Date();
      let allPredictions = [];

      if (now > deadline) {
        const predictions = await db.select({
          userId: preSeasonPredictions.userId,
          winner: preSeasonPredictions.winner,
          topScorer: preSeasonPredictions.topScorer,
          relegated: preSeasonPredictions.relegated,
          user: {
            id: users.id,
            nickname: users.nickname,
          }
        })
        .from(preSeasonPredictions)
        .leftJoin(users, eq(users.id, preSeasonPredictions.userId))
        .where(eq(preSeasonPredictions.leagueId, leagueId));

        allPredictions = predictions;
      }

      res.json({
        userPrediction: userPrediction[0] || null,
        allPredictions,
        deadline: deadline.toISOString()
      });
    } catch (error) {
      console.error("Error fetching pre-season tournament:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/leagues/:leagueId/pre-season-predictions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { leagueId } = req.params;
      const { winner, topScorer, relegated } = req.body;

      // Validate required fields
      if (!winner || !topScorer || !relegated) {
        return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
      }

      // Check deadline
      const deadline = new Date("2025-08-17T14:30:00");
      const now = new Date();
      if (now > deadline) {
        return res.status(400).json({ error: "Scadenza superata" });
      }

      // Check if user is member of the league
      const membership = await db.select()
        .from(leagueMembers)
        .where(and(
          eq(leagueMembers.leagueId, leagueId),
          eq(leagueMembers.userId, userId)
        ))
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      // Check if user already has prediction
      const existingPrediction = await db.select()
        .from(preSeasonPredictions)
        .where(and(
          eq(preSeasonPredictions.leagueId, leagueId),
          eq(preSeasonPredictions.userId, userId)
        ))
        .limit(1);

      if (existingPrediction.length > 0) {
        // Update existing prediction
        await db.update(preSeasonPredictions)
          .set({
            winner,
            topScorer,
            relegated,
            updatedAt: new Date()
          })
          .where(and(
            eq(preSeasonPredictions.leagueId, leagueId),
            eq(preSeasonPredictions.userId, userId)
          ));
      } else {
        // Create new prediction
        await db.insert(preSeasonPredictions).values({
          id: crypto.randomUUID(),
          leagueId,
          userId,
          winner,
          topScorer,
          relegated,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving pre-season predictions:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Special tournaments routes
  app.get("/api/leagues/:leagueId/special-tournaments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const league = await storage.getLeague(req.params.leagueId);
    if (!league) {
      return res.status(404).json({ error: "Lega non trovata" });
    }

    const isMember = await storage.isUserInLeague(league.id, req.session.userId);
    if (!isMember) {
      return res.status(403).json({ error: "Non sei membro di questa lega" });
    }

    const tournaments = await storage.getLeagueSpecialTournaments(req.params.leagueId);
    const userBets = await storage.getLeagueUserSpecialBets(req.session.userId, req.params.leagueId);

    // Include all bets for expired tournaments
    const now = new Date();
    const allBets = await Promise.all(tournaments.map(async (tournament: any) => {
      if (now > new Date(tournament.deadline)) {
        return await storage.getAllSpecialTournamentBets(tournament.id);
      }
      return [];
    }));

    res.json({ tournaments, userBets, allBets: allBets.flat() });
  });

  app.post("/api/leagues/:leagueId/special-tournaments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const league = await storage.getLeague(req.params.leagueId);
    if (!league) {
      return res.status(404).json({ error: "Lega non trovata" });
    }

    if (league.adminId !== req.session.userId) {
      return res.status(403).json({ error: "Solo l'admin può creare tornei speciali" });
    }

    try {
      const data = insertSpecialTournamentSchema.parse(req.body);
      const tournament = await storage.createSpecialTournament(data, req.params.leagueId);
      res.json(tournament);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.post("/api/special-tournaments/:tournamentId/bet", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { prediction } = req.body;
      if (!prediction || typeof prediction !== 'string') {
        return res.status(400).json({ error: "Previsione non valida" });
      }

      const bet = await storage.submitSpecialBet({
        tournamentId: req.params.tournamentId,
        prediction,
        userId: req.session.userId
      });
      res.json(bet);
    } catch (error) {
      console.error("Special bet submission error:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/special-tournaments/:tournamentId/bet", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { prediction } = req.body;
      if (!prediction || typeof prediction !== 'string') {
        return res.status(400).json({ error: "Previsione non valida" });
      }

      const bet = await storage.updateSpecialBet({
        tournamentId: req.params.tournamentId,
        prediction,
        userId: req.session.userId
      });
      res.json(bet);
    } catch (error) {
      console.error("Special bet update error:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.post("/api/special-bets", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const data = insertSpecialBetSchema.parse(req.body);
      const bet = await storage.submitSpecialBet({
        ...data,
        userId: req.session.userId
      });
      res.json(bet);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Preseason endpoints
  app.get("/api/extras/preseason/:leagueId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId } = req.params;

      // Check if user is member of the league
      const isMember = await storage.isUserInLeague(leagueId, req.session.userId);
      if (!isMember) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      const settings = await storage.getPreseasonSettings(leagueId); // This will auto-lock if deadline passed
      const userBet = await storage.getPreseasonBet(leagueId, req.session.userId);

      // Show all bets if locked OR if deadline has passed
      let allBets = [];
      const now = new Date();
      const lockDate = settings?.lockAt ? new Date(settings.lockAt) : null;
      const isLocked = settings?.locked || (lockDate && now > lockDate);

      console.log(`Preseason check - League: ${leagueId}, Locked: ${settings?.locked}, Lock date: ${settings?.lockAt}, Now: ${now.toISOString()}, Should show bets: ${isLocked}`);

      if (isLocked) {
        allBets = await storage.getAllPreseasonBets(leagueId);
        console.log(`Returning ${allBets.length} preseason bets for league ${leagueId}:`, allBets.map(b => ({ userId: b.userId, predictions: Object.keys(b.predictions) })));
      }

      res.json({ 
        userBet,
        settings,
        allBets,
        isLocked
      });
    } catch (error) {
      console.error("Get preseason bet error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/preseason", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId, winner, bottom, topScorer } = preseasonBetSchema.extend({
        leagueId: z.string()
      }).parse(req.body);

      // Check if user is member of the league
      const isMember = await storage.isUserInLeague(leagueId, req.session.userId);
      if (!isMember) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      // Check if still unlocked
      const settings = await storage.getPreseasonSettings(leagueId);
      if (settings && settings.locked) {
        return res.status(400).json({ error: "Pronostici bloccati" });
      }

      // Check deadline if set
      if (settings && settings.lockAt && new Date() > settings.lockAt) {
        return res.status(400).json({ error: "Scadenza superata" });
      }

      // Upsert the preseason bet
      await storage.upsertPreseasonBet({
        leagueId,
        userId: req.session.userId,
        winner,
        bottom: bottom,
        topScorer
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Preseason bet error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/preseason/lock", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId } = req.body;

      // Check if user is admin of the league
      const league = await storage.getLeague(leagueId);
      if (!league || league.adminId !== req.session.userId) {
        return res.status(403).json({ error: "Solo l'admin può gestire le impostazioni" });
      }

      const { lockAt } = req.body;

      if (lockAt) {
        // Update deadline - ensure proper date conversion
        const lockAtDate = new Date(lockAt);
        console.log(`Admin setting lock time for league ${leagueId}: ${lockAt} -> ${lockAtDate.toISOString()}`);
        await storage.upsertPreseasonSettings(leagueId, { lockAt: lockAtDate });
      } else {
        // Force lock now
        console.log(`Admin forcing lock now for league ${leagueId}`);
        await storage.lockPreseason(leagueId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Preseason lock error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/preseason/results", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId, ...results } = preseasonResultsSchema.extend({
        leagueId: z.string()
      }).parse(req.body);

      // Check if user is admin of the league
      const league = await storage.getLeague(leagueId);
      if (!league || league.adminId !== req.session.userId) {
        return res.status(403).json({ error: "Solo l'admin può impostare i risultati" });
      }

      // Check if locked
      const settings = await storage.getPreseasonSettings(leagueId);
      if (!settings || !settings.locked) {
        return res.status(400).json({ error: "Deve essere prima bloccato" });
      }

      await storage.setPreseasonResults(leagueId, results);

      // Calculate and assign points to users
      await storage.computePreseasonPoints(leagueId);

      res.json({ success: true });
    } catch (error) {
      console.error("Preseason results error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Supercoppa endpoints
  app.get("/api/extras/supercoppa/:leagueId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId } = req.params;

      // Check if user is member of the league
      const isMember = await storage.isUserInLeague(leagueId, req.session.userId);
      if (!isMember) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      const settings = await storage.getSupercoppaSettings(leagueId); // This will auto-lock if deadline passed
      const userBet = await storage.getSupercoppaBet(leagueId, req.session.userId);

      // Show all bets if locked OR if deadline has passed
      let allBets = [];
      const now = new Date();
      const lockDate = settings?.lockAt ? new Date(settings.lockAt) : null;
      const isLocked = settings?.locked || (lockDate && now > lockDate);

      console.log(`Supercoppa check - League: ${leagueId}, Locked: ${settings?.locked}, Lock date: ${settings?.lockAt}, Now: ${now.toISOString()}, Should show bets: ${isLocked}`);

      if (isLocked) {
        allBets = await storage.getAllSupercoppaBets(leagueId);
        console.log(`Returning ${allBets.length} supercoppa bets for league ${leagueId}:`, allBets.map(b => ({ userId: b.userId, predictions: Object.keys(b.predictions) })));
      }

      res.json({ 
        userBet,
        settings,
        allBets,
        isLocked
      });
    } catch (error) {
      console.error("Get supercoppa bet error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/supercoppa", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId, finalist1, finalist2, winner } = supercoppaBetSchema.extend({
        leagueId: z.string()
      }).parse(req.body);

      // Check if user is member of the league
      const isMember = await storage.isUserInLeague(leagueId, req.session.userId);
      if (!isMember) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      // Check if still unlocked
      const settings = await storage.getSupercoppaSettings(leagueId);
      if (settings && settings.locked) {
        return res.status(400).json({ error: "Pronostici bloccati" });
      }

      // Check deadline if set
      if (settings && settings.lockAt && new Date() > settings.lockAt) {
        return res.status(400).json({ error: "Scadenza superata" });
      }

      // Upsert the supercoppa bet
      await storage.upsertSupercoppaBet({
        leagueId,
        userId: req.session.userId,
        finalist1,
        finalist2,
        winner
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Supercoppa bet error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/supercoppa/lock", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId } = req.body;

      // Check if user is admin of the league
      const league = await storage.getLeague(leagueId);
      if (!league || league.adminId !== req.session.userId) {
        return res.status(403).json({ error: "Solo l'admin può gestire le impostazioni" });
      }

      const { lockAt } = req.body;

      if (lockAt) {
        // Update deadline - ensure proper date conversion
        const lockAtDate = new Date(lockAt);
        console.log(`Admin setting lock time for supercoppa league ${leagueId}: ${lockAt} -> ${lockAtDate.toISOString()}`);
        await storage.upsertSupercoppaSettings(leagueId, { lockAt: lockAtDate });
      } else {
        // Force lock now
        console.log(`Admin forcing lock now for supercoppa league ${leagueId}`);
        await storage.lockSupercoppa(leagueId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Supercoppa lock error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/supercoppa/results", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId, ...results } = supercoppaResultsSchema.extend({
        leagueId: z.string()
      }).parse(req.body);

      // Check if user is admin of the league
      const league = await storage.getLeague(leagueId);
      if (!league || league.adminId !== req.session.userId) {
        return res.status(403).json({ error: "Solo l'admin può impostare i risultati" });
      }

      // Admin can set results anytime, no lock restriction needed

      await storage.setSupercoppaResults(leagueId, results);

      // Calculate and assign points to users
      await storage.computeSupercoppaPoints(leagueId);

      res.json({ success: true });
    } catch (error) {
      console.error("Supercoppa results error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}