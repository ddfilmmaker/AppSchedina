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
  supercoppaResultsSchema,
  coppaSettingsSchema,
  coppaResultsSchema,
  coppaBetSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { leagueMembers, users, preSeasonPredictions, emailVerificationTokens, passwordResetTokens } from "@shared/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "./lib/email";

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
      // Registration
      const { nickname, email, password } = insertUserSchema.parse(req.body);

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
        email,
        password: hashedPassword,
        isAdmin: false
      });

      console.log("User created:", user.id);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store verification token in memory storage
      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email
      const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
      const verificationLink = `${appUrl}/auth/verify?token=${verificationToken}`;

      try {
        await sendEmail({
          to: email,
          subject: "Verifica la tua email – Schedina",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a; margin-bottom: 20px;">Benvenuto in Schedina, ${nickname}!</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                Clicca il pulsante qui sotto per verificare la tua email:
              </p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Verifica Email</a>
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 25px;">
                Oppure copia e incolla questo link nel tuo browser:<br>
                <span style="word-break: break-all; color: #16a34a;">${verificationLink}</span>
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 25px;">
                Il link scadrà tra 1 ora.
              </p>
            </div>
          `,
          text: `Benvenuto in Schedina, ${nickname}! Verifica la tua email visitando: ${verificationLink} (Il link scade tra 1 ora)`
        });
        console.log("Verification email sent to:", email);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Continue with registration even if email fails
      }

      req.session.userId = user.id;
      res.json({ 
        user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin },
        emailVerificationSent: true
      });
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
      res.clearCookie('connect.sid', { path: '/' });
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

    const unverified = !user.emailVerifiedAt;
    res.json({ 
      user: { 
        id: user.id, 
        nickname: user.nickname, 
        isAdmin: user.isAdmin,
        email: user.email,
        unverified 
      } 
    });
  });

  app.get("/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Verifica Email - Schedina</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <h1 style="color: #dc2626;">Token non valido</h1>
              <p>Il link di verifica non è valido.</p>
              <a href="${process.env.APP_URL || '/'}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Torna all'app</a>
            </body>
          </html>
        `);
      }

      // Find the verification token
      const record = await storage.getEmailVerificationToken(token);

      if (!record) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Verifica Email - Schedina</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <h1 style="color: #dc2626;">Token non trovato</h1>
              <p>Il link di verifica non è stato trovato o è già stato utilizzato.</p>
              <a href="${process.env.APP_URL || '/'}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Torna all'app</a>
            </body>
          </html>
        `);
      }

      // Check if token is already used
      if (record.usedAt) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Verifica Email - Schedina</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <h1 style="color: #dc2626;">Token già utilizzato</h1>
              <p>Questo link di verifica è già stato utilizzato.</p>
              <a href="${process.env.APP_URL || '/'}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Torna all'app</a>
            </body>
          </html>
        `);
      }

      // Check if token is expired
      if (new Date() > record.expiresAt) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Verifica Email - Schedina</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
              <h1 style="color: #dc2626;">Token scaduto</h1>
              <p>Il link di verifica è scaduto. Puoi richiedere un nuovo link dall'app.</p>
              <a href="${process.env.APP_URL || '/'}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Torna all'app</a>
            </body>
          </html>
        `);
      }

      // Mark token as used and update user
      await storage.useEmailVerificationToken(token);
      await storage.verifyUserEmail(record.userId);

      console.log("Email verified for user:", record.userId);

      // Redirect to main app with success flag
      const appUrl = process.env.APP_URL || '/';
      const redirectUrl = `${appUrl}${appUrl.includes('?') ? '&' : '?'}verified=1`;
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Verifica Email - Schedina</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
            <h1 style="color: #dc2626;">Errore del server</h1>
            <p>Si è verificato un errore interno. Riprova più tardi.</p>
            <a href="${process.env.APP_URL || '/'}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Torna all'app</a>
          </body>
        </html>
      `);
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(200).json({ success: true, message: "Se l'email esiste, riceverai un link per reimpostare la password" });
      }

      // Find user by email using storage method
      const user = await storage.getUserByEmail(email);

      // Convert to array format for consistency
      const userArray = user ? [user] : [];

      // Always return success for security
      if (userArray.length === 0) {
        return res.status(200).json({ success: true, message: "Se l'email esiste, riceverai un link per reimpostare la password" });
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in memory storage
      await storage.createPasswordResetToken({
        userId: userArray[0].id,
        token: resetToken,
        expiresAt,
      });

      // Send password reset email
      const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
      const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}`;

      try {
        await sendEmail({
          to: email,
          subject: "Reimposta la tua password - Schedina",
          html: `
            <h2>Richiesta di reset password</h2>
            <p>Hai richiesto di reimpostare la tua password. Clicca sul link qui sotto:</p>
            <p><a href="${resetLink}">Reimposta Password</a></p>
            <p>Il link scadrà tra 1 ora.</p>
            <p>Se non hai fatto questa richiesta, ignora questa email.</p>
          `,
          text: `Hai richiesto di reimpostare la tua password. Visita: ${resetLink} (Il link scade tra 1 ora)`
        });
        console.log("Password reset email sent to:", email);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }

      res.status(200).json({ success: true, message: "Se l'email esiste, riceverai un link per reimpostare la password" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(200).json({ success: true, message: "Se l'email esiste, riceverai un link per reimpostare la password" });
    }
  });

  app.get("/api/auth/reset", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Token non valido" });
      }

      // Find the reset token in memory storage
      const record = await storage.getPasswordResetToken(token);

      if (!record) {
        return res.status(400).json({ error: "Token non valido o scaduto" });
      }

      // Check if token is already used
      if (record.usedAt) {
        return res.status(400).json({ error: "Token già utilizzato" });
      }

      // Check if token is expired
      if (new Date() > record.expiresAt) {
        return res.status(400).json({ error: "Token scaduto" });
      }

      res.json({ success: true, message: "Token valido" });
    } catch (error) {
      console.error("Password reset token validation error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({ error: "Token o password non validi" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "La password deve essere di almeno 6 caratteri" });
      }

      // Find the reset token in memory storage
      const record = await storage.getPasswordResetToken(token);

      if (!record) {
        return res.status(400).json({ error: "Token non valido o scaduto" });
      }

      // Check if token is already used
      if (record.usedAt) {
        return res.status(400).json({ error: "Token già utilizzato" });
      }

      // Check if token is expired
      if (new Date() > record.expiresAt) {
        return res.status(400).json({ error: "Token scaduto" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password using the storage method
      await storage.updateUserPassword(record.userId, hashedPassword);

      // Mark token as used using the storage method
      await storage.usePasswordResetToken(token);

      console.log("Password reset successfully for user:", record.userId);
      res.json({ success: true, message: "Password reimpostata con successo" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
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

    // Ensure preseason points are computed if results are set
    const preseasonSettings = await storage.getPreseasonSettings(league.id);
    if (preseasonSettings?.resultsConfirmedAt) {
      await storage.computePreseasonPoints(league.id);
    }

    // Ensure supercoppa points are computed if results are set
    const supercoppaSettings = await storage.getSupercoppaSettings(league.id);
    if (supercoppaSettings?.resultsConfirmedAt) {
      await storage.computeSupercoppaPoints(league.id);
    }

    // Ensure coppa points are computed if results are set
    const coppaSettings = await storage.getCoppaSettings(league.id);
    if (coppaSettings?.resultsConfirmedAt) {
      await storage.computeCoppaPoints(league.id);
    }

    const leaderboard = await storage.getLeagueLeaderboard(league.id);
    console.log(`API leaderboard response for league ${league.id}:`, leaderboard.map(e => `${e.user.nickname}: ${e.points} points`));
    res.json(leaderboard);
  });

  // Winner declaration endpoint
  app.post("/api/leagues/:leagueId/declare-winner", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const leagueId = req.params.leagueId;
    const league = await storage.getLeague(leagueId);
    if (!league) {
      return res.status(404).json({ error: "Lega non trovata" });
    }

    // Only league admin can declare winner
    if (league.adminId !== req.session.userId) {
      return res.status(403).json({ error: "Solo l'admin può dichiarare il vincitore" });
    }

    try {
      const { winnerUserId, tiebreak = true } = req.body;

      // Check if winner already declared
      const existingWinner = await storage.getLeagueWinner(leagueId);
      if (existingWinner) {
        return res.status(200).json({
          winnerUserId: existingWinner.winnerUserId,
          method: "already_declared",
          detail: `Vincitore già dichiarato il ${existingWinner.declaredAt.toLocaleDateString()}`,
          declaredAt: existingWinner.declaredAt
        });
      }

      // If manual winner provided, use it
      if (winnerUserId) {
        await storage.declareLeagueWinner(leagueId, winnerUserId, "Selezione manuale dell'admin");
        return res.status(200).json({
          winnerUserId,
          method: "manual",
          detail: "Vincitore selezionato manualmente dall'admin"
        });
      }

      // Get current leaderboard
      const leaderboard = await storage.getLeagueLeaderboard(leagueId);
      if (leaderboard.length === 0) {
        return res.status(400).json({ error: "Nessun utente nella classifica" });
      }

      const topPoints = leaderboard[0].points;
      const tiedUsers = leaderboard.filter(entry => entry.points === topPoints);

      // Single leader case
      if (tiedUsers.length === 1) {
        const winner = tiedUsers[0];
        await storage.declareLeagueWinner(leagueId, winner.user.id, "Leader unico della classifica");
        return res.status(200).json({
          winnerUserId: winner.user.id,
          method: "clear_leader",
          detail: `Leader unico con ${topPoints} punti`
        });
      }

      // Multiple tied users - apply tiebreak if enabled
      if (!tiebreak) {
        return res.status(400).json({
          error: "Parità al primo posto",
          tiedUsers: tiedUsers.map(u => ({ id: u.user.id, nickname: u.user.nickname, points: u.points })),
          requiresManualSelection: true
        });
      }

      // Apply tiebreak logic using completed matchdays
      const matchdays = await storage.getLeagueMatchdays(leagueId);
      const completedMatchdays = matchdays
        .filter(md => md.isCompleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (completedMatchdays.length === 0) {
        return res.status(400).json({
          error: "Parità al primo posto senza giornate completate per il tiebreak",
          tiedUsers: tiedUsers.map(u => ({ id: u.user.id, nickname: u.user.nickname, points: u.points })),
          requiresManualSelection: true
        });
      }

      // Try tiebreak with each completed matchday in reverse chronological order
      for (const matchday of completedMatchdays) {
        // Get first match from this matchday to use as reference for getMatchDetails
        const matchdayMatches = await storage.getMatchdayMatches(matchday.id);
        if (matchdayMatches.length === 0) continue; // Skip if no matches in this matchday
        
        const matchdayDetails = await storage.getMatchDetails(matchdayMatches[0].id, matchday.id);
        const userTotals = matchdayDetails.matchdayTotals;
        
        // Calculate points for tied users in this matchday
        const matchdayResults = tiedUsers.map(entry => {
          const userTotal = userTotals.find(total => total.userId === entry.user.id);
          return {
            user: entry.user,
            matchdayPoints: userTotal ? userTotal.points : 0
          };
        }).sort((a, b) => b.matchdayPoints - a.matchdayPoints);

        // Check if tiebreak is resolved
        const highestMatchdayPoints = matchdayResults[0].matchdayPoints;
        const winnersAfterTiebreak = matchdayResults.filter(r => r.matchdayPoints === highestMatchdayPoints);

        if (winnersAfterTiebreak.length === 1) {
          const winner = winnersAfterTiebreak[0];
          const detail = `Deciso su ${matchday.name}: ${highestMatchdayPoints} vs ${matchdayResults[1].matchdayPoints} punti`;
          await storage.declareLeagueWinner(leagueId, winner.user.id, detail);
          return res.status(200).json({
            winnerUserId: winner.user.id,
            method: "tiebreak",
            detail
          });
        }

        // If still tied, continue to next matchday
        tiedUsers.splice(0, tiedUsers.length, ...winnersAfterTiebreak.map(r => 
          tiedUsers.find(tu => tu.user.id === r.user.id)!
        ));
      }

      // All matchdays exhausted, still tied - require manual selection
      return res.status(400).json({
        error: "Parità irrisolvibile dopo controllo di tutte le giornate",
        tiedUsers: tiedUsers.map(u => ({ id: u.user.id, nickname: u.user.nickname, points: u.points })),
        requiresManualSelection: true
      });

    } catch (error) {
      console.error("Winner declaration error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Get current winner for a league
  app.get("/api/leagues/:leagueId/winner", async (req, res) => {
    try {
      const leagueId = req.params.leagueId;
      
      if (!req.session.userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      // Check if user is member of the league
      const isMember = await storage.isUserInLeague(leagueId, req.session.userId);
      if (!isMember) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      const winnerData = await storage.getLeagueWinner(leagueId);
      
      if (!winnerData) {
        return res.status(404).json({ error: "Vincitore non ancora dichiarato" });
      }

      res.json({
        winnerUserId: winnerData.winnerUserId,
        declaredAt: winnerData.declaredAt,
        description: winnerData.decisionDetail
      });
    } catch (error) {
      console.error("Get winner error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
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

      console.log("Match creation request body:", req.body);
      console.log("Matchday ID:", req.params.id);

      const data = insertMatchSchema.parse(req.body);
      console.log("Parsed match data:", data);

      const match = await storage.createMatch({
        ...data,
        matchdayId: req.params.id
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
      const tournament = await storage.createSpecialTournament({
        ...data,
        leagueId: req.params.leagueId
      }, req.params.leagueId);
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

      const bet = await storage.submitSpecialBet({
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

  // Manual points endpoint
  app.post("/api/leagues/:leagueId/manual-points", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId } = req.params;
      const { userId, points } = req.body;

      // Check if user is admin of the league
      const league = await storage.getLeague(leagueId);
      if (!league || league.adminId !== req.session.userId) {
        return res.status(403).json({ error: "Solo l'admin può modificare i punti manuali" });
      }

      // Update manual points
      await storage.updateManualPoints(leagueId, userId, points);

      res.json({ success: true });
    } catch (error) {
      console.error("Manual points update error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Coppa Italia endpoints
  app.get("/api/extras/coppa/:leagueId", async (req, res) => {
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

      const settings = await storage.getCoppaSettings(leagueId); // This will auto-lock if deadline passed
      const userBet = await storage.getCoppaBet(leagueId, req.session.userId);

      // Show all bets if locked OR if deadline has passed
      let allBets = [];
      const now = new Date();
      const lockDate = settings?.lockAt ? new Date(settings.lockAt) : null;
      const isLocked = settings?.locked || (lockDate && now > lockDate);

      console.log(`Coppa check - League: ${leagueId}, Locked: ${settings?.locked}, Lock date: ${settings?.lockAt}, Now: ${now.toISOString()}, Should show bets: ${isLocked}`);

      if (isLocked) {
        allBets = await storage.getAllCoppaBets(leagueId);
        console.log(`Returning ${allBets.length} coppa bets for league ${leagueId}:`, allBets.map(b => ({ userId: b.userId, predictions: Object.keys(b.predictions) })));
      }

      res.json({ 
        userBet,
        settings,
        allBets,
        isLocked
      });
    } catch (error) {
      console.error("Get coppa bet error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/coppa", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId, winner } = coppaBetSchema.extend({
        leagueId: z.string()
      }).parse(req.body);

      // Check if user is member of the league
      const isMember = await storage.isUserInLeague(leagueId, req.session.userId);
      if (!isMember) {
        return res.status(403).json({ error: "Non sei membro di questa lega" });
      }

      // Check if still unlocked
      const settings = await storage.getCoppaSettings(leagueId);
      if (settings && settings.locked) {
        return res.status(400).json({ error: "Pronostici bloccati" });
      }

      // Check deadline if set
      if (settings && settings.lockAt && new Date() > settings.lockAt) {
        return res.status(400).json({ error: "Scadenza superata" });
      }

      // Upsert the coppa bet
      await storage.upsertCoppaBet({
        leagueId,
        userId: req.session.userId,
        winner
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Coppa bet error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/coppa/lock", async (req, res) => {
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
        console.log(`Admin setting lock time for coppa league ${leagueId}: ${lockAt} -> ${lockAtDate.toISOString()}`);
        await storage.upsertCoppaSettings(leagueId, { lockAt: lockAtDate });
      } else {
        // Force lock now
        console.log(`Admin forcing lock now for coppa league ${leagueId}`);
        await storage.lockCoppa(leagueId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Coppa lock error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/extras/coppa/results", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const { leagueId, ...results } = coppaResultsSchema.extend({
        leagueId: z.string()
      }).parse(req.body);

      // Check if user is admin of the league
      const league = await storage.getLeague(leagueId);
      if (!league || league.adminId !== req.session.userId) {
        return res.status(403).json({ error: "Solo l'admin può impostare i risultati" });
      }

      // Admin can set results anytime, no lock restriction needed

      await storage.setCoppaResults(leagueId, results);

      // Calculate and assign points to users
      await storage.computeCoppaPoints(leagueId);

      res.json({ success: true });
    } catch (error) {
      console.error("Coppa results error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Check if already verified
      if (user.emailVerifiedAt) {
        return res.status(400).json({ error: "Email già verificata" });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store verification token
      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email
      const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
      const verificationLink = `${appUrl}/auth/verify?token=${verificationToken}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Verifica la tua email – Schedina",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a; margin-bottom: 20px;">Verifica la tua email, ${user.nickname}!</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                Clicca il pulsante qui sotto per verificare la tua email:
              </p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="display: inline-block; padding: 12px 20px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Verifica Email</a>
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 25px;">
                Oppure copia e incolla questo link nel tuo browser:<br>
                <span style="word-break: break-all; color: #16a34a;">${verificationLink}</span>
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 25px;">
                Il link scadrà tra 1 ora.
              </p>
            </div>
          `,
          text: `Verifica la tua email, ${user.nickname}! Verifica la tua email visitando: ${verificationLink} (Il link scade tra 1 ora)`
        });
        console.log("Verification email resent to:", user.email);
      } catch (error) {
        console.error("Failed to resend verification email:", error);
        return res.status(500).json({ error: "Errore nell'invio dell'email" });
      }

      res.json({ success: true, message: "Email di verifica inviata" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Email configuration check endpoint
  app.get("/api/email/check", async (req, res) => {
    try {
      const hasApiKey = !!process.env.RESEND_API_KEY;
      const fromEmail = process.env.FROM_EMAIL || 'noreply@schedina.app';
      const fromName = process.env.FROM_NAME || 'Schedina';

      res.json({
        configured: hasApiKey,
        fromEmail,
        fromName,
        message: hasApiKey ? 'Email service is configured' : 'RESEND_API_KEY not found'
      });
    } catch (error) {
      res.json({ 
        configured: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Dev-only test endpoint for email verification
  app.post("/api/dev/send-test-email", async (req, res) => {
    // Protection: only allow in development or with test header
    const isDev = process.env.NODE_ENV !== 'production';
    const hasDevKey = req.headers['x-dev-key'] === 'TEST';

    if (!isDev && !hasDevKey) {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    try {
      const { to, subject, text } = req.body;

      if (!to || !subject || !text) {
        return res.status(400).json({ error: "Missing required fields: to, subject, text" });
      }

      await sendEmail({
        to,
        subject,
        text,
        html: `<pre>${text}</pre>`
      });

      console.log(`Test email sent to: ${to} with subject: ${subject}`);
      res.json({ ok: true });
    } catch (error) {
      console.error("Test email send error:", error);
      res.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}