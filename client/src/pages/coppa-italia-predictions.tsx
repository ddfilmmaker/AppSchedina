import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Calendar, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const SERIE_A_TEAMS = [
  "Milan", "Atalanta", "Bologna", "Cagliari", "Como", "Cremonese", 
  "Fiorentina", "Genoa", "Inter", "Juventus", "Lazio", "Lecce", 
  "Napoli", "Parma", "Pisa", "Roma", "Sassuolo", "Torino", "Udinese", "Verona"
];

function formatDateTime(dateTimeString: string) {
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

export default function CoppaItaliaPredictions() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [winner, setWinner] = useState("");
  const [lockAt, setLockAt] = useState("");
  const [officialWinner, setOfficialWinner] = useState("");

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

  // Get coppa data
  const { data: coppaData, isLoading } = useQuery({
    queryKey: [`/api/extras/coppa/${leagueId}`],
    enabled: !!leagueId,
    refetchInterval: 30000, // Refetch every 30 seconds to check for auto-lock
  });

  const userBet = (coppaData as any)?.userBet;
  const settings = (coppaData as any)?.settings;
  const allBets = (coppaData as any)?.allBets || [];
  const isLocked = (coppaData as any)?.isLocked || false;

  // Initialize form values when data loads
  useEffect(() => {
    if (userBet?.predictions?.winner) {
      setWinner(userBet.predictions.winner);
    }
  }, [userBet]);

  useEffect(() => {
    if (settings?.lockAt) {
      const lockDate = new Date(settings.lockAt);
      const localTime = new Date(lockDate.getTime() - lockDate.getTimezoneOffset() * 60000);
      const dateTimeLocal = localTime.toISOString().slice(0, 16);
      setLockAt(dateTimeLocal);
    }
  }, [settings]);

  useEffect(() => {
    if (settings?.officialWinner) {
      setOfficialWinner(settings.officialWinner);
    }
  }, [settings]);

  // Save predictions mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/extras/coppa`, { leagueId, winner });
    },
    onSuccess: () => {
      toast({
        title: "Pronostico salvato",
        description: "Il tuo pronostico è stato salvato con successo",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/coppa/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvare il pronostico",
        variant: "destructive",
      });
    },
  });

  // Save deadline mutation
  const saveDeadlineMutation = useMutation({
    mutationFn: async () => {
      const lockAtUTC = new Date(lockAt).toISOString();
      return apiRequest("POST", `/api/extras/coppa/lock`, { leagueId, lockAt: lockAtUTC });
    },
    onSuccess: () => {
      toast({
        title: "Scadenza aggiornata",
        description: "La scadenza è stata aggiornata",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/coppa/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiornare la scadenza",
        variant: "destructive",
      });
    },
  });

  // Force lock mutation
  const forceLockMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/extras/coppa/lock`, { leagueId });
    },
    onSuccess: () => {
      toast({
        title: "Pronostici bloccati",
        description: "I pronostici sono stati bloccati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/coppa/${leagueId}`] });
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
      return apiRequest("POST", `/api/extras/coppa/results`, {
        leagueId,
        officialWinner
      });
    },
    onSuccess: () => {
      toast({
        title: "Risultato confermato",
        description: "Il risultato ufficiale è stato confermato e i punti assegnati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/coppa/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel confermare il risultato",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!winner) {
      toast({
        title: "Campo mancante",
        description: "Seleziona la vincitrice finale",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const handleSaveResults = () => {
    if (!officialWinner) {
      toast({
        title: "Campo mancante",
        description: "Seleziona la vincitrice ufficiale",
        variant: "destructive",
      });
      return;
    }
    saveResultsMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Coppa Italia</h1>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Stato
            </span>
            <Badge variant={isLocked ? "destructive" : "default"}>
              {isLocked ? "Bloccato" : "Aperto"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings?.lockAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scadenza:
              </span>
              <span className="text-sm font-medium">
                {formatDateTime(settings.lockAt)}
              </span>
            </div>
          )}
          {settings?.resultsConfirmedAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Risultato confermato:</span>
              <span className="text-sm font-medium text-green-600">
                {settings.officialWinner}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Predictions */}
      {!isLocked && (
        <Card>
          <CardHeader>
            <CardTitle>I tuoi pronostici</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vincitrice finale
              </label>
              <Select value={winner} onValueChange={setWinner}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una squadra" />
                </SelectTrigger>
                <SelectContent>
                  {SERIE_A_TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full" 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salva"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Predictions (visible after lock) */}
      {isLocked && allBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Pronostici di tutti ({allBets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allBets.map((bet: any) => (
                <div key={bet.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {bet.userNickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{bet.userNickname}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{bet.predictions.winner}</div>
                    {settings?.officialWinner && (
                      <div className="text-sm">
                        {bet.predictions.winner === settings.officialWinner ? (
                          <span className="text-green-600 font-medium">+5 punti</span>
                        ) : (
                          <span className="text-gray-500">0 punti</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Impostazioni Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isLocked && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scadenza pronostici
                  </label>
                  <Input
                    type="datetime-local"
                    value={lockAt}
                    onChange={(e) => setLockAt(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => saveDeadlineMutation.mutate()} 
                    variant="outline"
                    disabled={saveDeadlineMutation.isPending}
                    className="flex-1"
                  >
                    {saveDeadlineMutation.isPending ? "Salvando..." : "Aggiorna scadenza"}
                  </Button>
                  <Button 
                    onClick={() => forceLockMutation.mutate()}
                    variant="destructive"
                    disabled={forceLockMutation.isPending}
                    className="flex-1"
                  >
                    {forceLockMutation.isPending ? "Bloccando..." : "Blocca ora"}
                  </Button>
                </div>
              </>
            )}

            {isLocked && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vincitrice ufficiale
                  </label>
                  <Select value={officialWinner} onValueChange={setOfficialWinner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona la vincitrice" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERIE_A_TEAMS.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSaveResults}
                  className="w-full"
                  disabled={saveResultsMutation.isPending}
                >
                  {saveResultsMutation.isPending ? "Confermando..." : "Conferma risultato"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}