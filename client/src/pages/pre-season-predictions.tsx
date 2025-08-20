import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const serieATeams = [
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

  const [winnerTeam, setWinnerTeam] = useState("");
  const [bottomTeam, setBottomTeam] = useState("");
  const [topScorer, setTopScorer] = useState("");

  // Get existing bet
  const { data: existingBet } = useQuery({
    queryKey: [`/api/extras/preseason/${leagueId}`],
    enabled: !!leagueId,
  });

  // Load existing values when data is available
  useEffect(() => {
    if (existingBet) {
      setWinnerTeam(existingBet.winner || "");
      setBottomTeam(existingBet.bottom || "");
      setTopScorer(existingBet.topScorer || "");
    }
  }, [existingBet]);

  const { mutate: saveBet, isPending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/extras/preseason", {
        method: "POST",
        body: JSON.stringify({
          leagueId,
          winnerTeam,
          bottomTeam,
          topScorer
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Salvato",
        description: "I tuoi pronostici sono stati salvati",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/extras/preseason/${leagueId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!winnerTeam || !bottomTeam || !topScorer) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi",
        variant: "destructive",
      });
      return;
    }
    saveBet();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href={`/leagues/${leagueId}/special-tournaments`}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Pronostici Pre-Stagione</h1>
      </div>

      {/* Winner Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Vincitrice Serie A</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={winnerTeam} onValueChange={setWinnerTeam}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona la vincitrice" />
            </SelectTrigger>
            <SelectContent>
              {serieATeams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bottom Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Ultima classificata</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={bottomTeam} onValueChange={setBottomTeam}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona l'ultima classificata" />
            </SelectTrigger>
            <SelectContent>
              {serieATeams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Top Scorer Input */}
      <Card>
        <CardHeader>
          <CardTitle>Capocannoniere</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Nome del giocatore"
            value={topScorer}
            onChange={(e) => setTopScorer(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isPending || !winnerTeam || !bottomTeam || !topScorer}
        className="w-full"
      >
        {isPending ? "Salvando..." : "Salva"}
      </Button>
    </div>
  );
}