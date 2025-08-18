import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Target, TrendingDown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CountdownTimer from "@/components/countdown-timer";

const serieATeams = {
  'milan': 'AC Milan',
  'inter': 'Inter Milano', 
  'juventus': 'Juventus',
  'roma': 'AS Roma',
  'napoli': 'SSC Napoli',
  'lazio': 'Lazio',
  'atalanta': 'Atalanta',
  'fiorentina': 'ACF Fiorentina',
  'bologna': 'Bologna FC',
  'torino': 'Torino FC',
  'udinese': 'Udinese Calcio',
  'empoli': 'Empoli FC',
  'parma': 'Parma Calcio 1913',
  'cagliari': 'Cagliari Calcio',
  'verona': 'Hellas Verona FC',
  'como': 'Como 1907',
  'lecce': 'US Lecce',
  'genoa': 'Genoa CFC',
  'monza': 'Monza',
  'venezia': 'Venezia FC'
};

export default function PreSeasonPredictions() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [winner, setWinner] = useState("");
  const [lastPlace, setLastPlace] = useState("");
  const [topScorer, setTopScorer] = useState("");

  const { data: leagueData, isLoading: isLoadingLeague } = useQuery({
    queryKey: ["/api/leagues", leagueId],
  });

  const { data: tournamentData, isLoading: isLoadingTournament } = useQuery({
    queryKey: ["/api/leagues", leagueId, "special-tournaments"],
  });

  const { data: userBet } = useQuery({
    queryKey: ["/api/special-tournaments", "preseason-2024", "bet"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!winner || !lastPlace || !topScorer) {
        throw new Error("Compila tutti i campi");
      }

      const prediction = JSON.stringify({
        winner,
        lastPlace,
        topScorer
      });

      return await apiRequest("POST", "/api/special-tournaments/preseason-2024/bet", {
        prediction,
        tournamentId: "preseason-2024"
      });
    },
    onSuccess: () => {
      toast({
        title: "Successo!",
        description: "Pronostici pre-stagione salvati",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/special-tournaments", "preseason-2024", "bet"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare il pronostico",
        variant: "destructive",
      });
    },
  });

  if (isLoadingLeague || isLoadingTournament) {
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

  const league = leagueData?.league || leagueData;
  const tournaments = Array.isArray(tournamentData?.tournaments) ? tournamentData.tournaments : [];
  const preseasonData = tournaments.find(t => t.id === "preseason-2024");

  if (!preseasonData) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href={`/leagues/${leagueId}/special-tournaments`}>
            <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Pronostici Pre-Stagione</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Torneo non disponibile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(preseasonData.deadline);
  const existingBet = userBet ? JSON.parse(userBet.prediction) : null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/leagues/${leagueId}/special-tournaments`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Pronostici Pre-Stagione</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              {preseasonData.name}
            </CardTitle>
            <Badge variant={preseasonData.isActive ? "default" : "secondary"}>
              {preseasonData.points} punti
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">{preseasonData.description}</p>
          
          {!isDeadlinePassed && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                <Award className="w-4 h-4" />
                Tempo rimasto per scommettere
              </div>
              <CountdownTimer targetDate={preseasonData.deadline} />
            </div>
          )}
          
          {isDeadlinePassed && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                La deadline per questo torneo è scaduta
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            I tuoi pronostici
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi vincerà la Serie A?
              </label>
              <Select 
                value={winner} 
                onValueChange={setWinner}
                disabled={isDeadlinePassed}
              >
                <SelectTrigger data-testid="select-winner">
                  <SelectValue placeholder="Seleziona il vincitore" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serieATeams).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi finirà ultimo?
              </label>
              <Select 
                value={lastPlace} 
                onValueChange={setLastPlace}
                disabled={isDeadlinePassed}
              >
                <SelectTrigger data-testid="select-last-place">
                  <SelectValue placeholder="Seleziona l'ultimo posto" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serieATeams).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi sarà il capocannoniere?
              </label>
              <Input
                value={topScorer}
                onChange={(e) => setTopScorer(e.target.value)}
                placeholder="Nome del giocatore"
                disabled={isDeadlinePassed}
                data-testid="input-top-scorer"
              />
            </div>
          </div>

          {existingBet && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 text-sm font-medium mb-2">Pronostici salvati:</p>
              <div className="text-sm text-green-600">
                <p>Vincitore: {serieATeams[existingBet.winner as keyof typeof serieATeams]}</p>
                <p>Ultimo: {serieATeams[existingBet.lastPlace as keyof typeof serieATeams]}</p>
                <p>Capocannoniere: {existingBet.topScorer}</p>
              </div>
            </div>
          )}

          {!isDeadlinePassed && (
            <Button 
              onClick={() => submitMutation.mutate()} 
              disabled={submitMutation.isPending || !winner || !lastPlace || !topScorer}
              className="w-full"
              data-testid="button-submit-prediction"
            >
              {submitMutation.isPending ? "Salvando..." : "Salva Pronostici"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}