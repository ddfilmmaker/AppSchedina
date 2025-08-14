import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Clock, CheckCircle, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/countdown-timer";
import { apiRequest } from "@/lib/queryClient";

interface SpecialTournament {
  id: string;
  name: string;
  type: string;
  deadline: string;
  isActive: boolean;
  points: number;
  description: string;
}

interface SpecialBet {
  id: string;
  tournamentId: string;
  userId: string;
  prediction: string;
  submittedAt: string;
  lastModified: string;
  tournament: SpecialTournament;
}

async function submitSpecialBet(tournamentId: string, prediction: string) {
  const response = await apiRequest("POST", "/api/special-bets", {
    tournamentId,
    prediction
  });
  return response.json();
}

export default function SpecialTournaments() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaguesData, isLoading } = useQuery({
    queryKey: ["/api/leagues"],
  });

  const submitBetMutation = useMutation({
    mutationFn: ({ tournamentId, prediction }: { tournamentId: string; prediction: string }) =>
      submitSpecialBet(tournamentId, prediction),
    onSuccess: () => {
      toast({
        title: "Pronostico salvato",
        description: "Il tuo pronostico è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/special-tournaments"] });
      setOpenDialog(null);
      setPredictions({});
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio del pronostico.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const leagues = Array.isArray(leaguesData) ? leaguesData : (leaguesData || []);;

  const getTournamentBadgeColor = (status: string) => {
    switch (status) {
      case "Aperto": return "bg-green-100 text-green-800";
      case "In corso": return "bg-blue-100 text-blue-800";
      case "Chiuso": return "bg-gray-100 text-gray-800";
      case "Scaduto": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTournamentCardColor = (tournament: SpecialTournament) => {
    switch (tournament.type) {
      case "preseason": return "from-amber-50 to-orange-50 border-amber-200";
      case "supercoppa": return "from-blue-50 to-indigo-50 border-blue-200";
      case "coppa_italia": return "from-green-50 to-emerald-50 border-green-200";
      default: return "from-gray-50 to-gray-50 border-gray-200";
    }
  };

  const getTournamentTextColor = (tournament: SpecialTournament) => {
    switch (tournament.type) {
      case "preseason": return "text-amber-900";
      case "supercoppa": return "text-blue-900";
      case "coppa_italia": return "text-green-900";
      default: return "text-gray-900";
    }
  };

  const handleSubmitBet = (tournamentId: string) => {
    const prediction = predictions[tournamentId];
    if (!prediction?.trim()) {
      toast({
        title: "Errore",
        description: "Il pronostico è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    submitBetMutation.mutate({ tournamentId, prediction });
  };

  const renderBetForm = (tournament: SpecialTournament) => {
    const existingBet = betMap.get(tournament.id);
    const status = getTournamentStatus(tournament);
    const isDisabled = status !== "Aperto";

    if (tournament.type === "preseason") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`winner-${tournament.id}`}>Vincitore Serie A (+10 punti)</Label>
            <Input
              id={`winner-${tournament.id}`}
              placeholder="es. Juventus"
              value={predictions[`${tournament.id}-winner`] || ""}
              onChange={(e) => setPredictions({
                ...predictions,
                [`${tournament.id}-winner`]: e.target.value
              })}
              disabled={isDisabled}
              data-testid={`input-winner-${tournament.id}`}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`lastplace-${tournament.id}`}>Ultimo posto (+5 punti)</Label>
            <Input
              id={`lastplace-${tournament.id}`}
              placeholder="es. Salernitana"
              value={predictions[`${tournament.id}-lastplace`] || ""}
              onChange={(e) => setPredictions({
                ...predictions,
                [`${tournament.id}-lastplace`]: e.target.value
              })}
              disabled={isDisabled}
              data-testid={`input-lastplace-${tournament.id}`}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`topscorer-${tournament.id}`}>Capocannoniere (+5 punti)</Label>
            <Input
              id={`topscorer-${tournament.id}`}
              placeholder="es. Lautaro Martinez"
              value={predictions[`${tournament.id}-topscorer`] || ""}
              onChange={(e) => setPredictions({
                ...predictions,
                [`${tournament.id}-topscorer`]: e.target.value
              })}
              disabled={isDisabled}
              data-testid={`input-topscorer-${tournament.id}`}
            />
          </div>

          <Button
            onClick={() => {
              const winner = predictions[`${tournament.id}-winner`];
              const lastplace = predictions[`${tournament.id}-lastplace`];
              const topscorer = predictions[`${tournament.id}-topscorer`];
              
              if (!winner || !lastplace || !topscorer) {
                toast({
                  title: "Errore",
                  description: "Tutti i campi sono obbligatori",
                  variant: "destructive",
                });
                return;
              }
              
              const combinedPrediction = JSON.stringify({
                winner,
                lastplace,
                topscorer
              });
              
              setPredictions({ ...predictions, [tournament.id]: combinedPrediction });
              handleSubmitBet(tournament.id);
            }}
            disabled={isDisabled || submitBetMutation.isPending}
            className="w-full"
            data-testid={`button-submit-${tournament.id}`}
          >
            {submitBetMutation.isPending ? "Salvataggio..." : (existingBet ? "Aggiorna Pronostico" : "Salva Pronostico")}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`prediction-${tournament.id}`}>
            {tournament.type === "supercoppa" ? "Finalisti e Vincitore" : "Vincitore"}
          </Label>
          <Textarea
            id={`prediction-${tournament.id}`}
            placeholder={
              tournament.type === "supercoppa" 
                ? "es. Finalisti: Juventus, Inter - Vincitore: Juventus"
                : "es. Juventus"
            }
            value={predictions[tournament.id] || existingBet?.prediction || ""}
            onChange={(e) => setPredictions({
              ...predictions,
              [tournament.id]: e.target.value
            })}
            disabled={isDisabled}
            data-testid={`input-prediction-${tournament.id}`}
          />
        </div>

        <Button
          onClick={() => handleSubmitBet(tournament.id)}
          disabled={isDisabled || submitBetMutation.isPending}
          className="w-full"
          data-testid={`button-submit-${tournament.id}`}
        >
          {submitBetMutation.isPending ? "Salvataggio..." : (existingBet ? "Aggiorna Pronostico" : "Salva Pronostico")}
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tornei Speciali</h1>
      </div>

      <div className="space-y-4">
        {leagues.length > 0 ? (
          leagues.map((league: any) => (
            <Link key={league.id} href={`/league/${league.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{league.name}</h4>
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      Tornei Speciali
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Visualizza i tornei speciali di questa lega
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Codice: {league.code}
                    </span>
                    <span className="text-primary text-sm font-medium">
                      Vai alla lega →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Devi essere membro di una lega per accedere ai tornei speciali</p>
              <div className="space-y-2">
                <Link href="/create-league">
                  <Button className="w-full">
                    Crea una nuova lega
                  </Button>
                </Link>
                <Link href="/join-league">
                  <Button variant="outline" className="w-full">
                    Unisciti a una lega
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )});

          return (
            <div
              key={tournament.id}
              className={`bg-gradient-to-r ${cardColors} border rounded-lg p-4`}
              data-testid={`card-tournament-${tournament.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold ${textColor}`} data-testid={`text-tournament-name-${tournament.id}`}>
                  {tournament.name}
                </h4>
                <Badge className={badgeColor} data-testid={`badge-status-${tournament.id}`}>
                  {status}
                </Badge>
              </div>
              
              <p className={`text-sm ${textColor.replace('900', '700')} mb-3`}>
                {tournament.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className={`text-xs ${textColor.replace('900', '600')}`}>
                    Scadenza: {new Date(tournament.deadline).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span className={`text-xs font-medium ${textColor}`}>
                    +{tournament.points} punti
                  </span>
                </div>
              </div>

              {status === "Aperto" && (
                <CountdownTimer 
                  deadline={tournament.deadline}
                  className={`text-sm font-semibold ${textColor} mb-3`}
                />
              )}

              {existingBet && (
                <div className="mb-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                  <div className="flex items-center space-x-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="font-medium">Pronostico salvato</span>
                  </div>
                  <div className={`${textColor.replace('900', '600')}`}>
                    Ultimo aggiornamento: {new Date(existingBet.lastModified).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {status === "Aperto" ? (
                  <Dialog open={openDialog === tournament.id} onOpenChange={(open) => setOpenDialog(open ? tournament.id : null)}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className={`${textColor} hover:opacity-80`}
                        variant="ghost"
                        data-testid={`button-participate-${tournament.id}`}
                      >
                        {existingBet ? "Modifica →" : "Partecipa →"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{tournament.name}</DialogTitle>
                        <DialogDescription>
                          {tournament.description}
                        </DialogDescription>
                      </DialogHeader>
                      {renderBetForm(tournament)}
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    disabled
                    className={`${textColor} opacity-50`}
                    data-testid={`button-view-${tournament.id}`}
                  >
                    {status === "Chiuso" ? "Completato" : "Scaduto"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      
    </div>
  );
}
