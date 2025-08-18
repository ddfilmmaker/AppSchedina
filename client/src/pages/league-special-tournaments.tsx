import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Calendar, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/countdown-timer";

export default function LeagueSpecialTournaments() {
  const { leagueId } = useParams();

  const { data: leagueData, isLoading: isLoadingLeague } = useQuery({
    queryKey: ["/api/leagues", leagueId],
  });

  const { data: tournamentData, isLoading: isLoadingTournament } = useQuery({
    queryKey: ["/api/leagues", leagueId, "special-tournaments"],
  });

  if (isLoadingLeague || isLoadingTournament) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const league = leagueData?.league || leagueData;
  const tournaments = Array.isArray(tournamentData?.tournaments) ? tournamentData.tournaments : [];

  const getTournamentRoute = (tournamentId: string) => {
    switch (tournamentId) {
      case "preseason-2024":
        return `/leagues/${leagueId}/pre-season-predictions`;
      case "supercoppa-2024":
        return `/leagues/${leagueId}/supercoppa-predictions`;
      case "coppa-italia-2024":
        return `/leagues/${leagueId}/coppa-italia-predictions`;
      default:
        return "#";
    }
  };

  const getTournamentColor = (type: string) => {
    switch (type) {
      case "preseason":
        return "from-yellow-400 to-orange-500";
      case "supercoppa":
        return "from-blue-400 to-purple-500";
      case "coppa_italia":
        return "from-green-400 to-teal-500";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getTournamentIcon = (type: string) => {
    switch (type) {
      case "preseason":
        return <Star className="w-5 h-5 text-yellow-600" />;
      case "supercoppa":
        return <Trophy className="w-5 h-5 text-blue-600" />;
      case "coppa_italia":
        return <Trophy className="w-5 h-5 text-green-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/leagues/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tornei Speciali</h1>
      </div>

      {league && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              {league.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Partecipa ai tornei speciali per guadagnare punti extra
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tournaments.length > 0 ? (
          tournaments.map((tournament: any) => {
            const isDeadlinePassed = new Date() > new Date(tournament.deadline);
            const isActive = tournament.isActive && !isDeadlinePassed;

            return (
              <Link key={tournament.id} href={getTournamentRoute(tournament.id)}>
                <Card className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? "border-primary" : "border-gray-200"
                }`}>
                  <CardContent className="p-4">
                    <div className={`w-full h-2 rounded-full mb-4 bg-gradient-to-r ${getTournamentColor(tournament.type)}`}></div>
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTournamentIcon(tournament.type)}
                        <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                      </div>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        +{tournament.points} punti
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {tournament.description}
                    </p>

                    {isActive ? (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                          <Clock className="w-4 h-4" />
                          Tempo rimasto
                        </div>
                        <CountdownTimer targetDate={tournament.deadline} />
                      </div>
                    ) : isDeadlinePassed ? (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                          <Calendar className="w-4 h-4" />
                          Deadline scaduta
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                          <Calendar className="w-4 h-4" />
                          Non ancora attivo
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        Scadenza: {new Date(tournament.deadline).toLocaleDateString('it-IT')}
                      </span>
                      <span className="text-primary text-sm font-medium">
                        {isActive ? "Partecipa →" : "Visualizza →"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Nessun torneo speciale disponibile al momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}