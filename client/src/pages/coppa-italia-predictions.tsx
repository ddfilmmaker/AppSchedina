import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CountdownTimer from "@/components/countdown-timer";

export default function CoppaItaliaPredictions() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [winner, setWinner] = useState("");

  // Serie A teams for Coppa Italia
  const serieATeams = {
    'juventus': 'Juventus',
    'inter': 'Inter',
    'milan': 'Milan',
    'napoli': 'Napoli',
    'atalanta': 'Atalanta',
    'roma': 'Roma',
    'lazio': 'Lazio',
    'fiorentina': 'Fiorentina',
    'bologna': 'Bologna',
    'torino': 'Torino',
    'udinese': 'Udinese',
    'sassuolo': 'Sassuolo',
    'genoa': 'Genoa',
    'sampdoria': 'Sampdoria',
    'spezia': 'Spezia',
    'cagliari': 'Cagliari',
    'verona': 'Hellas Verona',
    'empoli': 'Empoli',
    'salernitana': 'Salernitana',
    'cremonese': 'Cremonese'
  };

  const { data: leagueData, isLoading: isLoadingLeague } = useQuery({
    queryKey: ["/api/leagues", leagueId],
  });

  const { data: tournamentData, isLoading: isLoadingTournament } = useQuery({
    queryKey: ["/api/leagues", leagueId, "special-tournaments"],
  });

  const { data: userBet } = useQuery({
    queryKey: ["/api/special-tournaments", "coppa-italia-2024", "bet"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!winner) {
        throw new Error("Seleziona il vincitore della Coppa Italia");
      }

      const prediction = JSON.stringify({
        winner
      });

      return await apiRequest("POST", "/api/special-tournaments/coppa-italia-2024/bet", {
        prediction,
        tournamentId: "coppa-italia-2024"
      });
    },
    onSuccess: () => {
      toast({
        title: "Successo!",
        description: "Pronostico per la Coppa Italia salvato",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/special-tournaments", "coppa-italia-2024", "bet"],
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
  const coppaData = tournaments.find(t => t.id === "coppa-italia-2024");

  if (!coppaData) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href={`/leagues/${leagueId}/special-tournaments`}>
            <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Coppa Italia</h1>
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

  const isDeadlinePassed = new Date() > new Date(coppaData.deadline);
  const existingBet = userBet ? JSON.parse(userBet.prediction) : null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/leagues/${leagueId}/special-tournaments`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Coppa Italia</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              {coppaData.name}
            </CardTitle>
            <Badge variant={coppaData.isActive ? "default" : "secondary"}>
              {coppaData.points} punti
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">{coppaData.description}</p>
          
          {!isDeadlinePassed && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                <Award className="w-4 h-4" />
                Tempo rimasto per scommettere
              </div>
              <CountdownTimer targetDate={coppaData.deadline} />
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
            <Trophy className="w-5 h-5" />
            Il tuo pronostico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chi vincerà la Coppa Italia?
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

          {existingBet && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 text-sm font-medium mb-2">Pronostico salvato:</p>
              <p className="text-sm text-green-600">
                Vincitore: {serieATeams[existingBet.winner as keyof typeof serieATeams]}
              </p>
            </div>
          )}

          {!isDeadlinePassed && (
            <Button 
              onClick={() => submitMutation.mutate()} 
              disabled={submitMutation.isPending || !winner}
              className="w-full"
              data-testid="button-submit-prediction"
            >
              {submitMutation.isPending ? "Salvando..." : "Salva Pronostico"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}