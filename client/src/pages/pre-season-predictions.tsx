
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Calendar, Save, Lock, Settings, Trophy } from "lucide-react";
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
  });

  const userBet = (preseasonData as any)?.userBet;
  const settings = (preseasonData as any)?.settings;
  const allBets = (preseasonData as any)?.allBets || [];

  const isLocked = settings?.locked || false;
  const hasDeadlinePassed = settings?.lockAt && new Date() > new Date(settings.lockAt);

  // Initialize form data
  useEffect(() => {
    if (userBet) {
      setWinner(userBet.winner || "");
      setBottom(userBet.bottom || "");
      setTopScorer(userBet.topScorer || "");
    }
    if (settings?.lockAt) {
      setLockAt(new Date(settings.lockAt).toISOString().slice(0, 16));
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
      return apiRequest("POST", `/api/extras/preseason/lock`, { leagueId, lockAt });
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
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Pronostici Pre-stagione</h1>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        {isLocked ? (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Bloccato</span>
          </Badge>
        ) : hasDeadlinePassed ? (
          <Badge variant="secondary">Scaduto</Badge>
        ) : (
          <Badge variant="default">Aperto</Badge>
        )}
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Controlli Admin</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isLocked && (
              <>
                <div>
                  <Label htmlFor="lockAt">Scadenza</Label>
                  <Input
                    id="lockAt"
                    type="datetime-local"
                    value={lockAt}
                    onChange={(e) => setLockAt(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => saveDeadlineMutation.mutate()}
                    disabled={saveDeadlineMutation.isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    Salva Scadenza
                  </Button>
                  <Button
                    onClick={() => lockNowMutation.mutate()}
                    disabled={lockNowMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    Chiudi Ora
                  </Button>
                </div>
              </>
            )}

            {isLocked && (
              <>
                <h4 className="font-medium">Risultati Ufficiali</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="winnerOfficial">Vincitrice Ufficiale</Label>
                    <Select value={winnerOfficial} onValueChange={setWinnerOfficial}>
                      <SelectTrigger>
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
                    <Label htmlFor="bottomOfficial">Ultima Classificata Ufficiale</Label>
                    <Select value={bottomOfficial} onValueChange={setBottomOfficial}>
                      <SelectTrigger>
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
                    <Label htmlFor="topScorerOfficial">Capocannoniere Ufficiale</Label>
                    <Input
                      id="topScorerOfficial"
                      value={topScorerOfficial}
                      onChange={(e) => setTopScorerOfficial(e.target.value)}
                      placeholder="Nome giocatore"
                    />
                  </div>
                  <Button
                    onClick={() => saveResultsMutation.mutate()}
                    disabled={saveResultsMutation.isPending || !winnerOfficial || !bottomOfficial || !topScorerOfficial}
                    className="w-full"
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
      <Card>
        <CardHeader>
          <CardTitle>I Tuoi Pronostici</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="winner">Vincitrice Serie A</Label>
            <Select value={winner} onValueChange={setWinner} disabled={!canEdit}>
              <SelectTrigger>
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
            <Label htmlFor="bottom">Ultima Classificata</Label>
            <Select value={bottom} onValueChange={setBottom} disabled={!canEdit}>
              <SelectTrigger>
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
            <Label htmlFor="topScorer">Capocannoniere</Label>
            <Input
              id="topScorer"
              value={topScorer}
              onChange={(e) => setTopScorer(e.target.value)}
              placeholder="Nome del giocatore"
              disabled={!canEdit}
            />
          </div>

          {canEdit && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !winner || !bottom || !topScorer}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
          )}
        </CardContent>
      </Card>

      {/* All Predictions (visible after lock) */}
      {isLocked && allBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Tutti i Pronostici</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allBets.map((bet: any) => (
                <div key={bet.id} className="border rounded-lg p-3 space-y-2">
                  <h4 className="font-medium">{bet.user.nickname}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Vincitrice:</strong> {bet.winner}</div>
                    <div><strong>Ultima:</strong> {bet.bottom}</div>
                    <div><strong>Capocannoniere:</strong> {bet.topScorer}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-center">
        <Link href={`/league/${leagueId}`}>
          <Button variant="outline">
            Indietro
          </Button>
        </Link>
      </div>
    </div>
  );
}
