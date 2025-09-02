
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Calendar, Clock, Users, Star } from "lucide-react";
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
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-sm relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="h-20 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>
      
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center">
          <Link href={`/league/${leagueId}`}>
            <Button variant="ghost" size="icon" className="mr-3 text-primary hover:bg-primary/10 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary retro-title">Coppa Italia</h1>
        </div>

        {/* Status Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-primary retro-title flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Stato</span>
              </span>
              <Badge 
                variant={isLocked ? "destructive" : "default"}
                className={`${isLocked ? 'bg-red-500' : 'bg-green-500'} text-white font-bold rounded-full px-3 py-1`}
              >
                {isLocked ? "Bloccato" : "Aperto"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {settings?.lockAt && (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                <span className="text-primary font-medium flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Scadenza:</span>
                </span>
                <span className="text-primary font-bold text-sm">
                  {formatDateTime(settings.lockAt)}
                </span>
              </div>
            )}
            {settings?.resultsConfirmedAt && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <span className="text-primary font-medium">Risultato confermato:</span>
                <span className="text-green-600 font-bold">
                  {settings.officialWinner}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Predictions Form */}
        {!isLocked && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-primary retro-title flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>I Tuoi Pronostici</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              <div>
                <label className="block text-primary font-medium mb-3">
                  Vincitrice finale
                </label>
                <Select value={winner} onValueChange={setWinner} disabled={!true}>
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-primary h-12 bg-white">
                    <SelectValue placeholder="Seleziona una squadra" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {SERIE_A_TEAMS.map((team) => (
                      <SelectItem key={team} value={team} className="rounded-lg">
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Salvando..." : "Salva Pronostico"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All Predictions (visible after lock) */}
        {isLocked && allBets.length > 0 && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-primary retro-title flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Pronostici di tutti ({allBets.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                {allBets.map((bet: any) => (
                  <div key={bet.userId} className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 totocalcio-gradient rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">
                          {bet.userNickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-bold text-primary">{bet.userNickname}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{bet.predictions.winner}</div>
                      {settings?.officialWinner && (
                        <div className="text-sm font-medium">
                          {bet.predictions.winner === settings.officialWinner ? (
                            <span className="text-green-600 font-bold">+5 punti</span>
                          ) : (
                            <span className="text-primary/70">0 punti</span>
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
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-primary retro-title flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Impostazioni Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              {!isLocked && (
                <>
                  <div>
                    <label className="block text-primary font-medium mb-3">
                      Scadenza pronostici
                    </label>
                    <Input
                      type="datetime-local"
                      value={lockAt}
                      onChange={(e) => setLockAt(e.target.value)}
                      className="rounded-xl border-2 border-gray-200 focus:border-primary h-12 bg-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => saveDeadlineMutation.mutate()} 
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 font-bold border-0 shadow-lg"
                      disabled={saveDeadlineMutation.isPending}
                    >
                      {saveDeadlineMutation.isPending ? "Salvando..." : "Aggiorna scadenza"}
                    </Button>
                    <Button 
                      onClick={() => forceLockMutation.mutate()}
                      className="flex-1 retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg"
                      disabled={forceLockMutation.isPending}
                    >
                      {forceLockMutation.isPending ? "Bloccando..." : "Blocca ora"}
                    </Button>
                  </div>
                </>
              )}

              {isLocked && (
                <>
                  <div>
                    <label className="block text-primary font-medium mb-3">
                      Vincitrice ufficiale
                    </label>
                    <Select value={officialWinner} onValueChange={setOfficialWinner}>
                      <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-primary h-12 bg-white">
                        <SelectValue placeholder="Seleziona la vincitrice" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {SERIE_A_TEAMS.map((team) => (
                          <SelectItem key={team} value={team} className="rounded-lg">
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleSaveResults}
                    className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg"
                    disabled={saveResultsMutation.isPending}
                  >
                    {saveResultsMutation.isPending ? "Confermando..." : "Conferma Risultato"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
