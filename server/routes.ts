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
  insertSpecialBetSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { nickname, password } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByNickname(nickname);
      if (existingUser) {
        return res.status(400).json({ error: "Il nickname è già in uso" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        nickname,
        password: hashedPassword,
        isAdmin: false
      });
      
      req.session.userId = user.id;
      res.json({ user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin } });
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { nickname, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByNickname(nickname);
      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }
      
      req.session.userId = user.id;
      res.json({ user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin } });
    } catch (error) {
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
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    
    const user = await storage.getUser(req.session.userId);
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
    
    res.json({ matchday, matches, userPicks });
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
      const data = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch({
        ...data,
        matchdayId: req.params.matchdayId
      });
      res.json(match);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
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
    
    // Check admin permissions
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
      
      // Check if deadline has passed
      const match = await storage.getMatchdayMatches(data.matchId);
      // For now, we'll implement a simple check - in a real app this would be more sophisticated
      
      const pick = await storage.submitPick({
        ...data,
        userId: req.session.userId
      });
      
      res.json(pick);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Special tournament routes
  app.get("/api/special-tournaments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    
    const tournaments = await storage.getSpecialTournaments();
    const userBets = await storage.getUserSpecialBets(req.session.userId);
    
    res.json({ tournaments, userBets });
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

  const httpServer = createServer(app);
  return httpServer;
}
