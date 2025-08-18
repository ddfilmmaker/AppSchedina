import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CountdownTimer from "@/components/countdown-timer";

export default function SupercoppaPredictions() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [finalist1, setFinalist1] = useState("");
  const [finalist2, setFinalist2] = useState("");
  const [winner, setWinner] = useState("");

  // Teams in semifinals
  const semifinalTeams = {
    'napoli': 'Napoli',
    'milan': 'Milan',
    'bologna': 'Bologna', 
    'inter': 'Inter'
  };

  const { data: leagueData, isLoading: isLoadingLeague } = useQuery({
    queryKey: ["/api/leagues", leagueId],
  });

  const { data: tournamentData, isLoading: isLoadingTournament } = useQuery({
    queryKey: ["/api/leagues", leagueId, "special-tournaments"],
  });

  const { data: userBet } = useQuery({
    queryKey: ["/api/special-tournaments", "supercoppa-2024", "bet"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!finalist1 || !finalist2 || !winner) {
        throw new Error("Seleziona entrambi i finalisti e il vincitore");
      }

      const prediction = JSON.stringify({
        finalist1,
        finalist2,
        winner
      });

      return await apiRequest("POST", "/api/special-tournaments/supercoppa-2024/bet", {
        prediction,
        tournamentId: "supercoppa-2024"
      });
    },
    onSuccess: () => {
      toast({
        title: "Successo!",
        description: "Pronostico per la Supercoppa Italiana salvato",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/special-tournaments", "supercoppa-2024", "bet"],
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
  const supercoppaData = tournaments.find(t => t.id === "supercoppa-2024");

  if (!supercoppaData) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href={`/leagues/${leagueId}/special-tournaments`}>
            <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Supercoppa Italiana</h1>
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

  const isDeadlinePassed = new Date() > new Date(supercoppaData.deadline);
  const existingBet = userBet ? JSON.parse(userBet.prediction) : null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/leagues/${leagueId}/special-tournaments`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Supercoppa Italiana</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              {supercoppaData.name}
            </CardTitle>
            <Badge variant={supercoppaData.isActive ? "default" : "secondary"}>
              {supercoppaData.points} punti
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">{supercoppaData.description}</p>
          
          {!isDeadlinePassed && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                <Award className="w-4 h-4" />
                Tempo rimasto per scommettere
              </div>
              <CountdownTimer targetDate={supercoppaData.deadline} />
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
            <Users className="w-5 h-5" />
            I tuoi pronostici
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi saranno i finalisti? (Napoli vs Milan, Bologna vs Inter)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Select 
                  value={finalist1} 
                  onValueChange={setFinalist1}
                  disabled={isDeadlinePassed}
                >
                  <SelectTrigger data-testid="select-finalist1">
                    <SelectValue placeholder="1° Finalista" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(semifinalTeams).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={finalist2} 
                  onValueChange={setFinalist2}
                  disabled={isDeadlinePassed}
                >
                  <SelectTrigger data-testid="select-finalist2">
                    <SelectValue placeholder="2° Finalista" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(semifinalTeams).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi vincerà la Supercoppa?
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
                  {Object.entries(semifinalTeams).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {existingBet && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 text-sm font-medium mb-2">Pronostico salvato:</p>
              <div className="text-sm text-green-600">
                <p>Finalisti: {semifinalTeams[existingBet.finalist1 as keyof typeof semifinalTeams]} vs {semifinalTeams[existingBet.finalist2 as keyof typeof semifinalTeams]}</p>
                <p>Vincitore: {semifinalTeams[existingBet.winner as keyof typeof semifinalTeams]}</p>
              </div>
            </div>
          )}

          {!isDeadlinePassed && (
            <Button 
              onClick={() => submitMutation.mutate()} 
              disabled={submitMutation.isPending || !finalist1 || !finalist2 || !winner}
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