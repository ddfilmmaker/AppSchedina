import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MatchCard from "@/components/match-card";
import CountdownTimer from "@/components/countdown-timer";

export default function Matchday() {
  const [, params] = useRoute("/matchday/:id");
  const matchdayId = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/matchdays", matchdayId],
    enabled: !!matchdayId,
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-center">
        <p className="text-red-500">Giornata non trovata</p>
        <Link href="/">
          <Button className="mt-4">Torna alla Home</Button>
        </Link>
      </div>
    );
  }

  // Ensure data has the expected structure
  const matchday = (data as any)?.matchday;
  const matches = (data as any)?.matches || [];
  const userPicks = (data as any)?.userPicks || [];
  const allPicks = (data as any)?.allPicks || [];
  const now = new Date();
  const deadline = new Date(matchday?.deadline || new Date());
  const isExpired = now > deadline;

  // Create a map of user picks for easy lookup
  const pickMap = new Map();
  userPicks?.forEach((pick: any) => {
    pickMap.set(pick.matchId, pick);
  });

  // Create a map of all picks grouped by match (for expired matchdays)
  const allPicksMap = new Map();
  if (isExpired && allPicks.length > 0) {
    allPicks.forEach((pick: any) => {
      if (!allPicksMap.has(pick.matchId)) {
        allPicksMap.set(pick.matchId, []);
      }
      allPicksMap.get(pick.matchId).push(pick);
    });
  }

  const completedPicks = matches?.filter((match: any) => pickMap.has(match.id)).length || 0;
  const progress = (matches?.length || 0) > 0 ? (completedPicks / (matches?.length || 1)) * 100 : 0;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/league/${matchday?.leagueId || ''}`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900" data-testid="text-matchday-name">
          {matchday?.name || 'Giornata'}
        </h1>
      </div>

      {/* Matchday Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{matchday.name}</h2>
              <p className="text-sm text-gray-500">Giornata di campionato</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Scadenza</div>
              <CountdownTimer 
                deadline={matchday.deadline} 
                className="text-lg font-bold"
              />
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
              data-testid="progress-bar"
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span data-testid="text-progress">{completedPicks} su {matches.length} partite</span>
            <span>Salvato automaticamente</span>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <div className="space-y-4">
        {matches.map((match: any) => {
          const matchKickoff = new Date(match.kickoff);
          const isMatchLocked = now > new Date(matchKickoff.getTime() - 60000); // 1 minute before kickoff
          const userPick = pickMap.get(match.id);
          const matchPicks = allPicksMap.get(match.id) || [];

          return (
            <div key={match.id}>
              <MatchCard
                match={match}
                userPick={userPick}
                isLocked={isMatchLocked || isExpired}
              />
              
              {/* Show all participants' picks if deadline has passed */}
              {isExpired && matchPicks.length > 0 && (
                <Card className="mt-2 bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Pronostici dei partecipanti:</h4>
                    <div className="space-y-2">
                      {matchPicks.map((pick: any) => (
                        <div key={pick.user.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-600">{pick.user.nickname}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              pick.pick.pick === "1" ? "bg-blue-100 text-blue-800" :
                              pick.pick.pick === "X" ? "bg-gray-100 text-gray-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {pick.pick.pick === "1" ? "1" : pick.pick.pick === "X" ? "X" : "2"}
                            </span>
                            {match.result && (
                              <span className={`text-xs ${
                                pick.pick.pick === match.result ? "text-green-600 font-semibold" : "text-red-500"
                              }`}>
                                {pick.pick.pick === match.result ? "✓" : "✗"}
                              </span>
                            )}
                          </div>
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

      {matches.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Nessuna partita disponibile per questa giornata</p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {matches.length > 0 && (
        <div className="flex space-x-3">
          <Link href={`/leaderboard/${matchday.leagueId}`} className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-view-leaderboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Classifica
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
