import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Trophy, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CountdownTimer from "@/components/countdown-timer";

// Helper function to determine card background color based on tournament type
const getCardColors = (type: string) => {
  switch (type) {
    case "BOMBER":
      return "bg-gradient-to-br from-yellow-400 to-orange-500";
    case "GOAL":
      return "bg-gradient-to-br from-blue-400 to-purple-500";
    case "CLEAN_SHEET":
      return "bg-gradient-to-br from-green-400 to-teal-500";
    default:
      return "bg-gradient-to-br from-gray-700 to-gray-900";
  }
};

// Helper function to get the display label for tournament type
const getTypeLabel = (type: string) => {
  switch (type) {
    case "BOMBER":
      return "Capocannoniere";
    case "GOAL":
      return "Marcatore";
    case "CLEAN_SHEET":
      return "Porta Inviolata";
    default:
      return "Altro";
  }
};

export default function LeagueSpecialTournaments() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [predictions, setPredictions] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId, "special-tournaments"],
    enabled: !!leagueId,
  });

  const { data: leagueData } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  const { mutate: submitBet, isPending } = useMutation({
    mutationFn: async (tournamentId: string) => {
      const prediction = predictions[tournamentId]?.trim();
      if (!prediction) {
        throw new Error("Inserisci un pronostico");
      }

      const currentBet = userBetMap.get(tournamentId);

      return await apiRequest({
        url: `/api/special-tournaments/${tournamentId}/bet`,
        method: currentBet ? "PUT" : "POST",
        data: { prediction },
      });
    },
    onSuccess: () => {
      toast({
        title: "Pronostico salvato!",
        description: "Il tuo pronostico è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "special-tournaments"] });
      setPredictions({}); // Clear predictions after successful submission
    },
    onError: (err: any) => {
      toast({
        title: "Errore",
        description: err.response?.data?.error || "Impossibile salvare il pronostico.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitBet = (tournamentId: string) => {
    const prediction = predictions[tournamentId]?.trim();
    if (prediction) {
      submitBet(tournamentId);
    }
  };

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

  const tournaments = data?.tournaments || [];
  const userBets = data?.userBets || [];
  const allBets = data?.allBets || [];
  const league = leagueData?.league;

  // Create a map for quick lookup of user bets
  const userBetMap = new Map();
  userBets.forEach((bet: any) => {
    userBetMap.set(bet.tournamentId, bet);
  });

  // Create a map of all bets grouped by tournament (for expired tournaments)
  const allBetsMap = new Map();
  allBets.forEach((bet: any) => {
    if (!allBetsMap.has(bet.tournament.id)) {
      allBetsMap.set(bet.tournament.id, []);
    }
    allBetsMap.get(bet.tournament.id).push(bet);
  });

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/special-tournaments">
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tornei Speciali</h1>
          {league && <p className="text-sm text-gray-600">{league.name}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Pre-defined special tournaments */}
        <Link href={`/leagues/${leagueId}/pre-season-predictions`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-purple-500 to-pink-600 border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Pronostici Pre-Stagione</h3>
                  <p className="text-white/90 text-sm mb-3">
                    Fai i tuoi pronostici per la stagione Serie A 2025/26
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-white/80">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      17 Agosto, 14:30
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

              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-sm">
                  Clicca per fare i tuoi pronostici su vincitore, capocannoniere e retrocessioni →
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={/leagues/${leagueId}/supercoppa-predictions}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-blue-500 to-indigo-600 border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Supercoppa Italiana</h3>
                  <p className="text-white/90 text-sm mb-3">
                    Pronostica il risultato della Supercoppa Italiana
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-white/80">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      6 Gennaio 2025, 20:00
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      <span>20 punti</span>
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Supercoppa
                </Badge>
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-sm">
                  Pronostica vincitore e marcatore della Supercoppa →
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/coppa-italia/${leagueId}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-green-500 to-emerald-600 border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Coppa Italia</h3>
                  <p className="text-white/90 text-sm mb-3">
                    Pronostica il vincitore della Coppa Italia 2024/25
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-white/80">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      14 Maggio 2025, 21:00
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      <span>25 punti</span>
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Coppa Italia
                </Badge>
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-sm">
                  Pronostica la squadra vincitrice della Coppa Italia →
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}