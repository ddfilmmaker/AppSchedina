
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, Users, Calendar, Lock, Save, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Teams for semifinals
const SEMIFINALE_1_TEAMS = ["Napoli", "Milan"];
const SEMIFINALE_2_TEAMS = ["Bologna", "Inter"];

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

export default function SupercoppaPredictions() {
  const { leagueId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [finalist1, setFinalist1] = useState("");
  const [finalist2, setFinalist2] = useState("");
  const [winner, setWinner] = useState("");
  const [lockAt, setLockAt] = useState("");
  const [officialFinalist1, setOfficialFinalist1] = useState("");
  const [officialFinalist2, setOfficialFinalist2] = useState("");
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

  // Get supercoppa data
  const { data: supercoppaData, isLoading } = useQuery({
    queryKey: [`/api/extras/supercoppa/${leagueId}`],
    enabled: !!leagueId,
    refetchInterval: 30000, // Refetch every 30 seconds to check for auto-lock
  });

  const userBet = (supercoppaData as any)?.userBet;
  const settings = (supercoppaData as any)?.settings;
  const allBets = (supercoppaData as any)?.allBets || [];
  const isLocked = (supercoppaData as any)?.isLocked || settings?.locked;

  // Set initial values when data loads
  useEffect(() => {
    if (userBet?.predictions) {
      setFinalist1(userBet.predictions.finalist1 || "");
      setFinalist2(userBet.predictions.finalist2 || "");
      setWinner(userBet.predictions.winner || "");
    }
    if (settings?.lockAt) {
      const lockDate = new Date(settings.lockAt);
      const localDateTime = new Date(lockDate.getTime() - lockDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setLockAt(localDateTime);
    }
    if (settings) {
      setOfficialFinalist1(settings.officialFinalist1 || "");
      setOfficialFinalist2(settings.officialFinalist2 || "");
      setOfficialWinner(settings.officialWinner || "");
    }
  }, [userBet, settings]);

  const canEdit = !isLocked;
  const shouldShowAllBets = isLocked;

  // Get available winner options based on selected finalists
  const getWinnerOptions = () => {
    const options = [];
    if (finalist1) options.push(finalist1);
    if (finalist2 && finalist2 !== finalist1) options.push(finalist2);
    return options;
  };

  // Ensure winner is valid when finalists change
  useEffect(() => {
    const validOptions = getWinnerOptions();
    if (winner && !validOptions.includes(winner)) {
      setWinner("");
    }
  }, [finalist1, finalist2]);

  // Save predictions mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/extras/supercoppa`, { leagueId, finalist1, finalist2, winner });
    },
    onSuccess: () => {
      toast({
        title: "Pronostici salvati",
        description: "I tuoi pronostici sono stati salvati con successo",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/supercoppa/${leagueId}`] });
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
      const lockAtUTC = new Date(lockAt).toISOString();
      return apiRequest("POST", `/api/extras/supercoppa/lock`, { leagueId, lockAt: lockAtUTC });
    },
    onSuccess: () => {
      toast({
        title: "Scadenza aggiornata",
        description: "La scadenza è stata aggiornata",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/supercoppa/${leagueId}`] });
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
      return apiRequest("POST", `/api/extras/supercoppa/lock`, { leagueId });
    },
    onSuccess: () => {
      toast({
        title: "Pronostici bloccati",
        description: "I pronostici sono stati bloccati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/supercoppa/${leagueId}`] });
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
      return apiRequest("POST", `/api/extras/supercoppa/results`, {
        leagueId,
        officialFinalist1,
        officialFinalist2,
        officialWinner
      });
    },
    onSuccess: () => {
      toast({
        title: "Risultati confermati",
        description: "I risultati ufficiali sono stati confermati e i punti assegnati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/supercoppa/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel confermare i risultati",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!finalist1 || !finalist2 || !winner) {
      toast({
        title: "Campi mancanti",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const handleSaveResults = () => {
    if (!officialFinalist1 || !officialFinalist2 || !officialWinner) {
      toast({
        title: "Campi mancanti",
        description: "Tutti i risultati ufficiali sono obbligatori",
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
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
            </div>
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
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 text-primary hover:bg-primary/10 rounded-xl"
            onClick={() => setLocation(`/league/${leagueId}`)}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-primary retro-title">Supercoppa Italiana</h1>
        </div>

        {/* Status Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              {isLocked ? (
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div>
                <span className={`font-bold ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
                  {isLocked ? 'Bloccato' : 'Aperto'}
                </span>
                {settings?.lockAt && (
                  <p className="text-sm text-primary/70 font-medium">
                    {isLocked ? 'Bloccato il' : 'Scadenza:'} {formatDateTime(settings.lockAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Predictions Form */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-lg font-bold text-primary retro-title">I Tuoi Pronostici</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div>
              <Label className="text-primary font-bold mb-2 block" htmlFor="finalist1">
                Finalista da Semifinale 1 (Napoli vs Milan)
              </Label>
              <Select value={finalist1} onValueChange={setFinalist1} disabled={!canEdit}>
                <SelectTrigger className="rounded-xl border-2 border-primary/20 h-12 font-medium">
                  <SelectValue placeholder="Seleziona finalista" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  {SEMIFINALE_1_TEAMS.map((team) => (
                    <SelectItem key={team} value={team} className="font-medium">{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-primary font-bold mb-2 block" htmlFor="finalist2">
                Finalista da Semifinale 2 (Bologna vs Inter)
              </Label>
              <Select value={finalist2} onValueChange={setFinalist2} disabled={!canEdit}>
                <SelectTrigger className="rounded-xl border-2 border-primary/20 h-12 font-medium">
                  <SelectValue placeholder="Seleziona finalista" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  {SEMIFINALE_2_TEAMS.map((team) => (
                    <SelectItem key={team} value={team} className="font-medium">{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-primary font-bold mb-2 block" htmlFor="winner">
                Vincitore
              </Label>
              <Select value={winner} onValueChange={setWinner} disabled={!canEdit}>
                <SelectTrigger className="rounded-xl border-2 border-primary/20 h-12 font-medium">
                  <SelectValue placeholder="Seleziona vincitore" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  {getWinnerOptions().map((team) => (
                    <SelectItem key={team} value={team} className="font-medium">{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canEdit && (
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Salvando..." : "Salva"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Controls */}
        {isAdmin && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-8 px-8">
              <CardTitle className="text-lg font-bold text-primary retro-title">Controlli Admin</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              {!isLocked && (
                <>
                  <div>
                    <Label className="text-primary font-bold mb-2 block" htmlFor="lockAt">
                      Scadenza
                    </Label>
                    <Input
                      id="lockAt"
                      type="datetime-local"
                      value={lockAt}
                      onChange={(e) => setLockAt(e.target.value)}
                      className="rounded-xl border-2 border-primary/20 h-12 font-medium"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => saveDeadlineMutation.mutate()}
                      disabled={saveDeadlineMutation.isPending}
                      variant="outline"
                      className="flex-1 rounded-xl h-12 border-2 border-primary/20 text-primary font-bold hover:bg-primary/10"
                    >
                      {saveDeadlineMutation.isPending ? "Salvando..." : "Salva scadenza"}
                    </Button>
                    <Button
                      onClick={() => lockNowMutation.mutate()}
                      disabled={lockNowMutation.isPending}
                      className="flex-1 retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {lockNowMutation.isPending ? "Bloccando..." : "Chiudi ora"}
                    </Button>
                  </div>
                </>
              )}

              {isLocked && !settings?.resultsConfirmedAt && (
                <>
                  <h4 className="font-bold text-primary">Risultati Ufficiali</h4>
                  <div>
                    <Label className="text-primary font-bold mb-2 block" htmlFor="officialFinalist1">
                      Finalista 1
                    </Label>
                    <Select value={officialFinalist1} onValueChange={setOfficialFinalist1}>
                      <SelectTrigger className="rounded-xl border-2 border-primary/20 h-12 font-medium">
                        <SelectValue placeholder="Seleziona finalista 1" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {SEMIFINALE_1_TEAMS.map((team) => (
                          <SelectItem key={team} value={team} className="font-medium">{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-primary font-bold mb-2 block" htmlFor="officialFinalist2">
                      Finalista 2
                    </Label>
                    <Select value={officialFinalist2} onValueChange={setOfficialFinalist2}>
                      <SelectTrigger className="rounded-xl border-2 border-primary/20 h-12 font-medium">
                        <SelectValue placeholder="Seleziona finalista 2" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {SEMIFINALE_2_TEAMS.map((team) => (
                          <SelectItem key={team} value={team} className="font-medium">{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-primary font-bold mb-2 block" htmlFor="officialWinner">
                      Vincitore Ufficiale
                    </Label>
                    <Select value={officialWinner} onValueChange={setOfficialWinner}>
                      <SelectTrigger className="rounded-xl border-2 border-primary/20 h-12 font-medium">
                        <SelectValue placeholder="Seleziona vincitore" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {[officialFinalist1, officialFinalist2].filter(Boolean).map((team) => (
                          <SelectItem key={team} value={team} className="font-medium">{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSaveResults}
                    disabled={saveResultsMutation.isPending}
                    className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {saveResultsMutation.isPending ? "Confermando..." : "Conferma risultati"}
                  </Button>
                </>
              )}

              {settings?.resultsConfirmedAt && (
                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <span className="font-bold text-green-800">Risultati confermati</span>
                      <p className="text-sm text-green-600 font-medium">
                        {formatDateTime(settings.resultsConfirmedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Predictions (visible after lock or deadline passed) */}
        {shouldShowAllBets && allBets && allBets.length > 0 && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-8 px-8">
              <CardTitle className="text-lg font-bold text-primary retro-title flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Tutti i pronostici</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {allBets.map((bet: any) => (
                  <div key={bet.userId} className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-primary">{bet.userNickname}</div>
                      {bet.points > 0 && settings?.resultsConfirmedAt && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          {bet.points} pt
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-primary/70 space-y-1 font-medium">
                      <div>Finalista 1: <span className="text-primary font-bold">{bet.predictions.finalist1}</span></div>
                      <div>Finalista 2: <span className="text-primary font-bold">{bet.predictions.finalist2}</span></div>
                      <div>Vincitore: <span className="text-primary font-bold">{bet.predictions.winner}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {shouldShowAllBets && (!allBets || allBets.length === 0) && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <p className="text-primary/70 font-medium">Nessun pronostico ancora</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
