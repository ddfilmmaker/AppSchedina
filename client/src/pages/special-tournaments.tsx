import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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

export default function SpecialTournaments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [predictions, setPredictions] = useState({});

  const { data: leaguesData, isLoading: isLoadingLeagues } = useQuery({
    queryKey: ["/api/leagues"],
  });

  if (isLoadingLeagues) {
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

  const leagues = Array.isArray(leaguesData) ? leaguesData : (leaguesData || []);

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
            <Link key={league.id} href={`/special-tournaments/${league.id}`}>
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
                      Vai ai tornei speciali →
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
        )}
      </div>
    </div>
  );
}

function LeagueSpecialTournaments({ leagueId }: { leagueId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [predictions, setPredictions] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId, "special-tournaments"],
    enabled: !!leagueId,
  });

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

  // Create a map for quick lookup of user bets
  const userBetMap = new Map();
  userBets.forEach((bet: any) => {
    userBetMap.set(bet.special_tournaments.id, bet);
  });

  // Create a map of all bets grouped by tournament (for expired tournaments)
  const allBetsMap = new Map();
  allBets.forEach((bet: any) => {
    if (!allBetsMap.has(bet.tournament.id)) {
      allBetsMap.set(bet.tournament.id, []);
    }
    allBetsMap.get(bet.tournament.id).push(bet);
  });

  const { mutate: submitBet } = useMutation({
    mutationFn: async (tournamentId: string) => {
      const prediction = predictions[tournamentId];
      if (!prediction) return;

      const currentBet = userBetMap.get(tournamentId);

      return await apiRequest({
        url: `/api/special-tournaments/${tournamentId}/bet`,
        method: currentBet ? "PUT" : "POST",
        data: { prediction },
      });
    },
    onSuccess: (res) => {
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
        description: err.response?.data?.message || "Impossibile salvare il pronostico.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitBet = (tournamentId: string) => {
    if (predictions[tournamentId] && predictions[tournamentId].trim()) {
      submitBet(tournamentId);
    } else if (userBetMap.get(tournamentId)?.special_bets?.prediction) {
      // If the input is empty and there was a previous bet, allow submission to clear it (handled by backend logic if needed)
      // For now, we only submit if there's new input or if the user wants to update.
      // If we want to allow clearing, we'd need specific backend handling for empty prediction.
      // For simplicity, if input is empty and there was a bet, we don't do anything unless backend supports clearing.
    }
  };


  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tornei Speciali</h1>
      </div>

      <div className="space-y-4">
        {tournaments.map((tournament: any) => {
          const userBet = userBetMap.get(tournament.id);
          const now = new Date();
          const deadline = new Date(tournament.deadline);
          const isExpired = now > deadline;
          const cardColors = getCardColors(tournament.type);
          const tournamentBets = allBetsMap.get(tournament.id) || [];

          return (
            <div key={tournament.id}>
              <Card className={`${cardColors} border-2`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{tournament.name}</h3>
                      <p className="text-white/90 text-sm mb-3">{tournament.description}</p>

                      <div className="flex items-center space-x-4 text-sm text-white/80">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <CountdownTimer deadline={tournament.deadline} />
                        </div>
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          <span>{tournament.points} punti</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {getTypeLabel(tournament.type)}
                    </Badge>
                  </div>

                  {!isExpired ? (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Inserisci il tuo pronostico..."
                        value={predictions[tournament.id] || userBet?.special_bets?.prediction || ""}
                        onChange={(e) => setPredictions(prev => ({
                          ...prev,
                          [tournament.id]: e.target.value
                        }))}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60 resize-none"
                        rows={3}
                      />

                      <Button
                        onClick={() => handleSubmitBet(tournament.id)}
                        disabled={
                          !predictions[tournament.id]?.trim() &&
                          !userBet?.special_bets?.prediction
                        }
                        className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
                      >
                        {userBet ? "Aggiorna Pronostico" : "Salva Pronostico"}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="text-white/70 text-sm">Scadenza superata</p>
                      {userBet && (
                        <p className="text-white font-medium mt-2">
                          Il tuo pronostico: "{userBet.special_bets.prediction}"
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Show all participants' bets if deadline has passed */}
              {isExpired && tournamentBets.length > 0 && (
                <Card className="mt-2 bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Pronostici dei partecipanti:</h4>
                    <div className="space-y-3">
                      {tournamentBets.map((bet: any) => (
                        <div key={bet.user.id} className="border-l-4 border-blue-500 pl-3">
                          <div className="font-medium text-gray-700 text-sm">{bet.user.nickname}</div>
                          <p className="text-gray-600 text-sm mt-1">"{bet.bet.prediction}"</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}