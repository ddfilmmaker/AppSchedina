
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Trophy, Target, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const serieATeams2025_26 = [
  "AC Milan",
  "Inter Milano", 
  "Juventus",
  "AS Roma",
  "SSC Napoli",
  "Lazio",
  "Atalanta",
  "ACF Fiorentina",
  "Bologna FC",
  "Torino FC",
  "Udinese Calcio",
  "Empoli FC",
  "Parma Calcio 1913",
  "Cagliari Calcio",
  "Hellas Verona FC",
  "Como 1907",
  "US Lecce",
  "Genoa CFC",
  "Monza",
  "Venezia FC"
];

export default function PreSeasonPredictions() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [predictions, setPredictions] = useState({
    winner: "",
    topScorer: "",
    relegated: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId, "pre-season-tournament"],
    enabled: !!leagueId,
  });

  const { data: leagueData } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  const { mutate: submitPrediction, isPending } = useMutation({
    mutationFn: async () => {
      if (!predictions.winner || !predictions.topScorer || !predictions.relegated) {
        throw new Error("Compila tutti i campi");
      }

      return await apiRequest(`/api/leagues/${leagueId}/pre-season-predictions`, {
        method: "POST",
        body: JSON.stringify(predictions),
      });
    },
    onSuccess: () => {
      toast({
        title: "Successo!",
        description: "I tuoi pronostici sono stati salvati",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "pre-season-tournament"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  // Load existing predictions
  useEffect(() => {
    if (data?.userPrediction) {
      setPredictions({
        winner: data.userPrediction.winner || "",
        topScorer: data.userPrediction.topScorer || "",
        relegated: data.userPrediction.relegated || ""
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const deadline = new Date(data?.deadline || "2025-08-17T14:30:00");
  const now = new Date();
  const isExpired = now > deadline;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to={`/leagues/${leagueId}/special-tournaments`}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Pronostici Pre-Stagione</h1>
      </div>

      {/* League Info */}
      {leagueData?.league && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{leagueData.league.name}</CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Deadline Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Scadenza pronostici:</p>
            <p className="font-bold text-lg">
              {deadline.toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {isExpired && (
              <p className="text-red-600 font-semibold mt-2">Scadenza superata</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Predictions Form */}
      <div className="space-y-4">
        {/* Winner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Vincitore Serie A 2025/26</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={predictions.winner}
              onValueChange={(value) => setPredictions(prev => ({ ...prev, winner: value }))}
              disabled={isExpired}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona la squadra vincitrice" />
              </SelectTrigger>
              <SelectContent>
                {serieATeams2025_26.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Top Scorer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Target className="w-5 h-5 text-green-500" />
              <span>Capocannoniere</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Nome del giocatore</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="es. Lautaro Martinez"
                value={predictions.topScorer}
                onChange={(e) => setPredictions(prev => ({ ...prev, topScorer: e.target.value }))}
                disabled={isExpired}
              />
            </div>
          </CardContent>
        </Card>

        {/* Relegated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span>Ultima Classificata</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={predictions.relegated}
              onValueChange={(value) => setPredictions(prev => ({ ...prev, relegated: value }))}
              disabled={isExpired}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona l'ultima classificata" />
              </SelectTrigger>
              <SelectContent>
                {serieATeams2025_26.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      {!isExpired && (
        <Button 
          onClick={() => submitPrediction()} 
          disabled={isPending || !predictions.winner || !predictions.topScorer || !predictions.relegated}
          className="w-full"
        >
          {isPending ? "Salvando..." : "Salva Pronostici"}
        </Button>
      )}

      {/* Show all predictions after deadline */}
      {isExpired && data?.allPredictions && data.allPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tutti i Pronostici</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.allPredictions.map((prediction: any, index: number) => (
                <div key={prediction.userId} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-semibold mb-2">{prediction.user.nickname}</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Vincitore:</strong> {prediction.winner}</p>
                    <p><strong>Capocannoniere:</strong> {prediction.topScorer}</p>
                    <p><strong>Ultima:</strong> {prediction.relegated}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
