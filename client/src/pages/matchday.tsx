
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
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-sm relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-3xl"></div>
              <div className="h-48 bg-gray-200 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="max-w-sm mx-auto px-4 py-6 text-center relative z-10">
          <p className="text-red-500 mb-4 font-medium">Giornata non trovata</p>
          <Link href="/">
            <Button className="retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold">Torna alla Home</Button>
          </Link>
        </div>
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

  // Create a map of all picks grouped by match (filter by individual match deadlines)
  const allPicksMap = new Map();
  if (allPicks.length > 0) {
    allPicks.forEach((item: any) => {
      // Find the match for this pick
      const match = matches.find((m: any) => m.id === item.matchId);
      if (match) {
        const matchDeadline = new Date(match.deadline);
        const isMatchExpired = now > matchDeadline;
        
        // Only include picks for matches where deadline has passed
        if (isMatchExpired) {
          if (!allPicksMap.has(item.matchId)) {
            allPicksMap.set(item.matchId, []);
          }
          allPicksMap.get(item.matchId).push(item);
        }
      }
    });
  }

  const completedPicks = matches?.filter((match: any) => pickMap.has(match.id)).length || 0;
  const progress = (matches?.length || 0) > 0 ? (completedPicks / (matches?.length || 1)) * 100 : 0;

  return (
    <div className="min-h-screen paper-texture">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>
      
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6 relative z-10">
        <div className="flex items-center mb-6">
          <Link href={`/league/${matchday?.leagueId || ''}`}>
            <Button variant="ghost" size="icon" className="mr-3 text-primary hover:bg-primary/10 rounded-xl" data-testid="button-back">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary retro-title" data-testid="text-matchday-name">
            {matchday?.name || 'Giornata'}
          </h1>
        </div>

        {/* Matchday Header */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-primary retro-title">{matchday.name}</h2>
                <p className="text-sm text-primary/70 font-medium">Giornata di campionato</p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-success to-accent h-3 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
                data-testid="progress-bar"
              ></div>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-primary" data-testid="text-progress">{completedPicks} su {matches.length} partite</span>
              <span className="text-primary/70">Salvato automaticamente</span>
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
            
            console.log(`Match ${match.homeTeam} vs ${match.awayTeam}: deadline=${match.deadline}, expired=${isMatchExpired}, picks=${matchPicks.length}, allPicks total=${allPicks.length}`);

            return (
              <div key={match.id}>
                <MatchCard
                  match={match}
                  userPick={userPick}
                  isLocked={isMatchExpired}
                  user={user}
                  deadline={match.deadline}
                />

                {/* Show all participants' picks if match deadline has passed */}
                {isMatchExpired && matchPicks.length > 0 && (
                  <Card className="mt-3 retro-card border-0 rounded-2xl overflow-hidden bg-gray-50/80">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-bold text-primary mb-3">Pronostici dei partecipanti:</h4>
                      <div className="space-y-2">
                        {matchPicks.map((item: any) => (
                          <div key={item.user.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-primary">{item.user.nickname}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-xl text-xs font-bold ${
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
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Show message if match is expired but no picks */}
                {isMatchExpired && matchPicks.length === 0 && (
                  <Card className="mt-3 retro-card border-0 rounded-2xl overflow-hidden bg-gray-50/80">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-bold text-primary mb-3">Pronostici dei partecipanti:</h4>
                      <div className="text-sm text-primary/70 text-center font-medium">
                        Nessun pronostico trovato per questa partita
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>

        {matches.length === 0 && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <p className="text-primary/70 font-medium">Nessuna partita disponibile per questa giornata</p>
            </CardContent>
          </Card>
        )}

        {/* Matchday Leaderboard */}
        {matches.length > 0 && matches.some((match: any) => now > new Date(match.deadline)) && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-primary retro-title mb-4">Classifica Giornata</h3>
              <div className="space-y-3">
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
                    <div key={userData.user.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-500 text-white' :
                          'bg-gray-100 text-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-bold text-primary">{userData.user.nickname}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{userData.points}</div>
                        <div className="text-xs text-primary/70 font-medium">{userData.correctPicks}/{matches.length}</div>
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
          <div className="flex space-x-3 pt-4">
            <Link href={`/leaderboard/${matchday.leagueId}`} className="flex-1">
              <Button 
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 retro-button rounded-2xl h-12 text-white border-0 font-bold shadow-lg" 
                data-testid="button-view-leaderboard"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Classifica Generale
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
