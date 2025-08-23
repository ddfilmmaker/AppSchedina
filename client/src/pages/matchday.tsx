import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MatchCard from "@/components/match-card";
import CountdownTimer from "@/components/countdown-timer";
import { useAuth } from "@/lib/auth"; // Assuming useAuth is in this path

export default function Matchday() {
  const [, params] = useRoute("/matchday/:id");
  const matchdayId = params?.id;
  const { user } = useAuth(); // Get the user object

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

  // Check if matchday is expired (all matches have passed their deadline)
  const isExpired = matches.length > 0 && matches.every((match: any) => now > new Date(match.deadline));

  // Create a map of user picks for easy lookup
  const pickMap = new Map();
  userPicks?.forEach((pick: any) => {
    pickMap.set(pick.matchId, pick);
  });

  // Create a map of all picks grouped by match (for expired matchdays)
  const allPicksMap = new Map();
  if (isExpired && allPicks.length > 0) {
    allPicks.forEach((item: any) => {
      if (!allPicksMap.has(item.matchId)) {
        allPicksMap.set(item.matchId, []);
      }
      allPicksMap.get(item.matchId).push(item);
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
          const matchDeadline = new Date(match.deadline);
          const isMatchExpired = now > matchDeadline;
          const userPick = pickMap.get(match.id);
          const matchPicks = allPicksMap.get(match.id) || [];

          return (
            <div key={match.id}>
              <MatchCard
                match={match}
                userPick={userPick}
                isLocked={isMatchExpired}
                user={user}
                matchDeadline={match.deadline}
              />

              {/* Show all participants' picks if match deadline has passed */}
              {isMatchExpired && (
                <Card className="mt-2 bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Pronostici dei partecipanti:</h4>
                    <div className="space-y-2">
                      {matchPicks.length > 0 ? (
                        matchPicks.map((item: any) => (
                          <div key={item.user.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-600">{item.user.nickname}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                item.pick.pick === "1" ? "bg-blue-100 text-blue-800" :
                                item.pick.pick === "X" ? "bg-gray-100 text-gray-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {item.pick.pick === "1" ? "1" : item.pick.pick === "X" ? "X" : "2"}
                              </span>
                              {match.result && (
                                <span className={`text-xs ${
                                  item.pick.pick === match.result ? "text-green-600 font-semibold" : "text-red-500"
                                }`}>
                                  {item.pick.pick === match.result ? "✓" : "✗"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center">
                          Nessun pronostico trovato per questa partita
                        </div>
                      )}
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

      {/* Matchday Leaderboard */}
      {matches.length > 0 && matches.some((match: any) => now > new Date(match.deadline)) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classifica Giornata</h3>
            <div className="space-y-2">
              {(() => {
                // Calculate points for each user for this matchday only
                const userPoints = new Map();
                
                // Initialize all users with 0 points
                allPicks.forEach(item => {
                  if (!userPoints.has(item.user.id)) {
                    userPoints.set(item.user.id, {
                      user: item.user,
                      points: 0,
                      correctPicks: 0
                    });
                  }
                });

                // Calculate points for each match result
                matches.forEach(match => {
                  if (!match.result) return;
                  
                  const matchPicks = allPicks.filter(pick => pick.matchId === match.id);
                  matchPicks.forEach(item => {
                    const userData = userPoints.get(item.user.id);
                    if (item.pick.pick === match.result) {
                      userData.points += 1;
                      userData.correctPicks += 1;
                    }
                  });
                });

                // Convert to array and sort by points
                const sortedUsers = Array.from(userPoints.values())
                  .sort((a, b) => b.points - a.points);

                return sortedUsers.map((userData, index) => (
                  <div key={userData.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-300 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{userData.user.nickname}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{userData.points}</div>
                      <div className="text-xs text-gray-500">{userData.correctPicks}/{matches.length}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {matches.length > 0 && (
        <div className="flex space-x-3">
          <Link href={`/leaderboard/${matchday.leagueId}`} className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-view-leaderboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Classifica Generale
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}