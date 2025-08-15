
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CountdownTimer from "@/components/countdown-timer";

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

      return await apiRequest({
        url: `/api/leagues/${leagueId}/pre-season-predictions`,
        method: "POST",
        data: predictions,
      });
    },
    onSuccess: () => {
      toast({
        title: "Pronostici salvati!",
        description: "I tuoi pronostici pre-stagione sono stati salvati con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "pre-season-tournament"] });
    },
    onError: (err: any) => {
      toast({
        title: "Errore",
        description: err.message || "Impossibile salvare i pronostici.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    submitPrediction();
  };

  // Load existing predictions if available
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

  const league = leagueData?.league;
  const deadline = new Date("2025-08-17T14:30:00"); // Serie A season start deadline
  const now = new Date();
  const isExpired = now > deadline;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/special-tournaments/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pronostici Pre-Stagione</h1>
          {league && <p className="text-sm text-gray-600">{league.name}</p>}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-2">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Serie A 2025/26</h3>
              <p className="text-white/90 text-sm mb-3">
                Fai i tuoi pronostici per la prossima stagione di Serie A
              </p>

              <div className="flex items-center space-x-4 text-sm text-white/80">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <CountdownTimer deadline={deadline.toISOString()} />
                </div>
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  <span>30 punti</span>
                </div>
              </div>
            </div>

            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Pre-Stagione
            </Badge>
          </div>

          {!isExpired ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="winner" className="text-white font-medium">
                  Chi vincerà il campionato?
                </Label>
                <Select 
                  value={predictions.winner} 
                  onValueChange={(value) => setPredictions(prev => ({ ...prev, winner: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="topScorer" className="text-white font-medium">
                  Quale squadra avrà il capocannoniere?
                </Label>
                <Select 
                  value={predictions.topScorer} 
                  onValueChange={(value) => setPredictions(prev => ({ ...prev, topScorer: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Seleziona la squadra del capocannoniere" />
                  </SelectTrigger>
                  <SelectContent>
                    {serieATeams2025_26.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relegated" className="text-white font-medium">
                  Quale squadra retrocederà per prima?
                </Label>
                <Select 
                  value={predictions.relegated} 
                  onValueChange={(value) => setPredictions(prev => ({ ...prev, relegated: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Seleziona la prima retrocessa" />
                  </SelectTrigger>
                  <SelectContent>
                    {serieATeams2025_26.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isPending || !predictions.winner || !predictions.topScorer || !predictions.relegated}
                className="w-full bg-white text-gray-900 hover:bg-white/90 font-semibold"
              >
                {isPending ? "Salvando..." : data?.userPrediction ? "Aggiorna Pronostici" : "Salva Pronostici"}
              </Button>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm">Scadenza superata</p>
              {data?.userPrediction && (
                <div className="text-white font-medium mt-2 space-y-1">
                  <p>Vincitore: {data.userPrediction.winner}</p>
                  <p>Capocannoniere: {data.userPrediction.topScorer}</p>
                  <p>Prima retrocessa: {data.userPrediction.relegated}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show all participants' predictions if deadline has passed */}
      {isExpired && data?.allPredictions && data.allPredictions.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pronostici dei partecipanti:</h4>
            <div className="space-y-3">
              {data.allPredictions.map((prediction: any) => (
                <div key={prediction.userId} className="border-l-4 border-purple-500 pl-3">
                  <div className="font-medium text-gray-700 text-sm">{prediction.user.nickname}</div>
                  <div className="text-gray-600 text-sm mt-1 space-y-1">
                    <p>Vincitore: {prediction.winner}</p>
                    <p>Capocannoniere: {prediction.topScorer}</p>
                    <p>Prima retrocessa: {prediction.relegated}</p>
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
