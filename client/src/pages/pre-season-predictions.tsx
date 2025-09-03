
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Calendar, Save, Lock, Settings, Trophy, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

const SERIE_A_TEAMS = [
  "Milan", "Atalanta", "Bologna", "Cagliari", "Como", "Cremonese",
  "Fiorentina", "Genoa", "Inter", "Juventus", "Lazio", "Lecce",
  "Napoli", "Parma", "Pisa", "Roma", "Sassuolo", "Torino", "Udinese", "Verona"
];

// Helper function to format date and time
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }) + " alle " + date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function PreSeasonPredictions() {
  const { leagueId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [winner, setWinner] = useState("");
  const [bottom, setBottom] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [lockAt, setLockAt] = useState("");
  const [winnerOfficial, setWinnerOfficial] = useState("");
  const [bottomOfficial, setBottomOfficial] = useState("");
  const [topScorerOfficial, setTopScorerOfficial] = useState("");

  // Get current user
  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });
  const user = (authData as any)?.user;

  // Get league data
  const { data: leagueData } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  const league = (leagueData as any)?.league;
  const isAdmin = user?.id === league?.adminId;

  // Get preseason data
  const { data: preseasonData, isLoading } = useQuery({
    queryKey: [`/api/extras/preseason/${leagueId}`],
    enabled: !!leagueId,
    refetchInterval: 30000, // Refetch every 30 seconds to check for auto-lock
  });

  const userBet = (preseasonData as any)?.userBet;
  const settings = (preseasonData as any)?.settings;
  const allBets = (preseasonData as any)?.allBets || [];

  console.log("Preseason data:", { userBet, settings, allBetsCount: allBets.length });

  const isLocked = settings?.locked || false;
  const hasDeadlinePassed = settings?.lockAt && new Date() > new Date(settings.lockAt);
  const shouldShowAllBets = isLocked || hasDeadlinePassed;

  // Initialize form data
  useEffect(() => {
    if (userBet) {
      setWinner(userBet.winner || "");
      setBottom(userBet.bottom || "");
      setTopScorer(userBet.topScorer || "");
    }
    if (settings?.lockAt) {
      // Convert UTC time to local time for the datetime-local input
      const lockDate = new Date(settings.lockAt);
      const localISOTime = new Date(lockDate.getTime() - lockDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setLockAt(localISOTime);
    }
    if (settings) {
      setWinnerOfficial(settings.winnerOfficial || "");
      setBottomOfficial(settings.bottomOfficial || "");
      setTopScorerOfficial(settings.topScorerOfficial || "");
    }
  }, [userBet, settings]);

  // Save predictions mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/extras/preseason`, { leagueId, winner, bottom, topScorer });
    },
    onSuccess: () => {
      toast({
        title: "Pronostici salvati",
        description: "I tuoi pronostici sono stati salvati con successo",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/preseason/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvare i pronostici",
        variant: "destructive",
      });
    },
  });

  // Save deadline mutation
  const saveDeadlineMutation = useMutation({
    mutationFn: async () => {
      // Convert local time to UTC for server storage
      const lockAtUTC = new Date(lockAt).toISOString();
      return apiRequest("POST", `/api/extras/preseason/lock`, { leagueId, lockAt: lockAtUTC });
    },
    onSuccess: () => {
      toast({
        title: "Scadenza aggiornata",
        description: "La scadenza è stata aggiornata",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/preseason/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiornare la scadenza",
        variant: "destructive",
      });
    },
  });

  // Lock now mutation
  const lockNowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/extras/preseason/lock`, { leagueId });
    },
    onSuccess: () => {
      toast({
        title: "Pronostici bloccati",
        description: "I pronostici sono stati bloccati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/preseason/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel bloccare i pronostici",
        variant: "destructive",
      });
    },
  });

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/extras/preseason/results`, { leagueId, winnerOfficial, bottomOfficial, topScorerOfficial });
    },
    onSuccess: () => {
      toast({
        title: "Risultati confermati",
        description: "I risultati ufficiali sono stati salvati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/preseason/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvare i risultati",
        variant: "destructive",
      });
    },
  });

  const canEdit = !isLocked && !hasDeadlinePassed;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/league/${leagueId}`}>
            <Button variant="ghost" size="icon" className="mr-2 hover:bg-white/80 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary retro-title">Pronostici Pre-stagione</h1>
          <div className="w-10"></div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          {isLocked ? (
            <Badge variant="destructive" className="flex items-center space-x-1 rounded-xl px-3 py-1">
              <Lock className="w-3 h-3" />
              <span className="font-medium">Bloccato</span>
            </Badge>
          ) : hasDeadlinePassed ? (
            <Badge variant="secondary" className="flex items-center space-x-1 rounded-xl px-3 py-1">
              <Lock className="w-3 h-3" />
              <span className="font-medium">Scaduto</span>
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl px-3 py-1">
              <span className="font-medium">Aperto</span>
            </Badge>
          )}

          {/* Show lock date/time */}
          {settings?.lockAt && (
            <div className="text-right">
              <p className="text-xs text-primary/60 font-medium">
                {isLocked || hasDeadlinePassed ? "Bloccato il:" : "Scadenza:"}
              </p>
              <p className="text-sm font-bold text-primary">
                {formatDateTime(settings.lockAt)}
              </p>
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center space-x-2 text-primary retro-title">
                <Settings className="w-5 h-5" />
                <span>Controlli Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {!isLocked && (
                <>
                  <div>
                    <Label htmlFor="lockAt" className="text-primary font-medium">Scadenza</Label>
                    <Input
                      id="lockAt"
                      type="datetime-local"
                      value={lockAt}
                      onChange={(e) => setLockAt(e.target.value)}
                      className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => saveDeadlineMutation.mutate()}
                      disabled={saveDeadlineMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl h-12 font-bold shadow-lg"
                    >
                      Salva Scadenza
                    </Button>
                    <Button
                      onClick={() => lockNowMutation.mutate()}
                      disabled={lockNowMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 rounded-xl h-12 font-bold shadow-lg"
                    >
                      Chiudi Ora
                    </Button>
                  </div>
                </>
              )}

              {isLocked && (
                <>
                  <h4 className="font-bold text-primary retro-title">Risultati Ufficiali</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="winnerOfficial" className="text-primary font-medium">Vincitrice Ufficiale</Label>
                      <Select value={winnerOfficial} onValueChange={setWinnerOfficial}>
                        <SelectTrigger className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary">
                          <SelectValue placeholder="Seleziona vincitrice" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERIE_A_TEAMS.map((team) => (
                            <SelectItem key={team} value={team}>{team}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bottomOfficial" className="text-primary font-medium">Ultima Classificata Ufficiale</Label>
                      <Select value={bottomOfficial} onValueChange={setBottomOfficial}>
                        <SelectTrigger className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary">
                          <SelectValue placeholder="Seleziona ultima" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERIE_A_TEAMS.map((team) => (
                            <SelectItem key={team} value={team}>{team}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="topScorerOfficial" className="text-primary font-medium">Capocannoniere Ufficiale</Label>
                      <Input
                        id="topScorerOfficial"
                        value={topScorerOfficial}
                        onChange={(e) => setTopScorerOfficial(e.target.value)}
                        placeholder="Nome giocatore"
                        className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary"
                      />
                    </div>
                    <Button
                      onClick={() => saveResultsMutation.mutate()}
                      disabled={saveResultsMutation.isPending || !winnerOfficial || !bottomOfficial || !topScorerOfficial}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl h-12 font-bold shadow-lg"
                    >
                      Conferma Risultati
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Predictions Form */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-primary retro-title flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>I Tuoi Pronostici</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <div>
              <Label htmlFor="winner" className="text-primary font-medium">Vincitrice Serie A</Label>
              <Select value={winner} onValueChange={setWinner} disabled={!canEdit}>
                <SelectTrigger className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary h-12">
                  <SelectValue placeholder="Seleziona la vincitrice" />
                </SelectTrigger>
                <SelectContent>
                  {SERIE_A_TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bottom" className="text-primary font-medium">Ultima Classificata</Label>
              <Select value={bottom} onValueChange={setBottom} disabled={!canEdit}>
                <SelectTrigger className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary h-12">
                  <SelectValue placeholder="Seleziona l'ultima" />
                </SelectTrigger>
                <SelectContent>
                  {SERIE_A_TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="topScorer" className="text-primary font-medium">Capocannoniere</Label>
              <Input
                id="topScorer"
                value={topScorer}
                onChange={(e) => setTopScorer(e.target.value)}
                placeholder="Nome del giocatore"
                disabled={!canEdit}
                className="mt-2 rounded-xl border-2 border-gray-200 focus:border-primary h-12"
              />
            </div>

            {canEdit && (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !winner || !bottom || !topScorer}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl h-12 font-bold shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Salvando..." : "Salva Pronostici"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* All Predictions (visible after lock or deadline passed) */}
        {shouldShowAllBets && allBets && allBets.length > 0 && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center space-x-2 text-primary retro-title">
                <Users className="w-5 h-5" />
                <span>Tutti i Pronostici ({allBets.length})</span>
              </CardTitle>
              {settings?.lockAt && (
                <p className="text-sm text-primary/60 font-medium mt-2">
                  Bloccato il {formatDateTime(settings.lockAt)}
                </p>
              )}
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {allBets.map((bet: any, index: number) => (
                  <div key={bet.userId || index} className="p-5 border-2 border-gray-100 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm">
                    <h4 className="font-bold mb-3 text-primary retro-title">
                      {bet.userNickname || `Partecipante ${index + 1}`}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-gray-50/80 rounded-xl">
                        <span className="font-medium text-primary">Vincitore:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-bold">{bet.predictions?.winner || "Non specificato"}</span>
                          {settings?.winnerOfficial && bet.predictions?.winner === settings.winnerOfficial && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50/80 rounded-xl">
                        <span className="font-medium text-primary">Ultima:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-bold">{bet.predictions?.lastPlace || "Non specificato"}</span>
                          {settings?.bottomOfficial && bet.predictions?.lastPlace === settings.bottomOfficial && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50/80 rounded-xl">
                        <span className="font-medium text-primary">Capocannoniere:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-bold">{bet.predictions?.topScorer || "Non specificato"}</span>
                          {settings?.topScorerOfficial && bet.predictions?.topScorer === settings.topScorerOfficial && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {bet.submittedAt && (
                      <div className="mt-3 text-xs text-primary/60 font-medium bg-gray-50/50 p-2 rounded-xl">
                        Inviato: {formatDateTime(bet.submittedAt)}
                      </div>
                    )}
                    
                    {/* Show points earned if official results are confirmed */}
                    {settings?.resultsConfirmedAt && (
                      <div className="mt-3 pt-3 border-t-2 border-gray-100">
                        <div className="flex justify-between items-center bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-xl">
                          <div className="text-sm text-primary font-medium">
                            Punti guadagnati: 
                            <span className="font-bold ml-1 text-lg">
                              {(bet.predictions?.winner === settings.winnerOfficial ? 10 : 0) +
                               (bet.predictions?.lastPlace === settings.bottomOfficial ? 5 : 0) +
                               (bet.predictions?.topScorer === settings.topScorerOfficial ? 5 : 0)}
                            </span>
                          </div>
                          <div className="text-xs text-primary/70 font-medium">
                            {bet.predictions?.winner === settings.winnerOfficial && "✓ Vincitore (+10) "}
                            {bet.predictions?.lastPlace === settings.bottomOfficial && "✓ Ultima (+5) "}
                            {bet.predictions?.topScorer === settings.topScorerOfficial && "✓ Capocannoniere (+5)"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {shouldShowAllBets && (!allBets || allBets.length === 0) && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-primary/70 font-medium">Nessun pronostico inviato ancora</p>
            </CardContent>
          </Card>
        )}

        {/* Official Results (visible when confirmed) */}
        {settings?.resultsConfirmedAt && settings?.winnerOfficial && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center space-x-2 text-primary retro-title">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Risultati Ufficiali</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <span className="font-medium text-primary">Vincitore:</span>
                  <span className="text-primary font-bold">{settings.winnerOfficial}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                  <span className="font-medium text-primary">Ultima:</span>
                  <span className="text-primary font-bold">{settings.bottomOfficial}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
                  <span className="font-medium text-primary">Capocannoniere:</span>
                  <span className="text-primary font-bold">{settings.topScorerOfficial}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-gray-100 text-xs text-primary/60 font-medium text-center bg-gray-50/50 p-2 rounded-xl">
                Confermato il {formatDateTime(settings.resultsConfirmedAt)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Link href={`/league/${leagueId}`}>
            <Button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 rounded-xl px-8 h-12 font-bold shadow-lg">
              Indietro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
