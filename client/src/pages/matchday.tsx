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

  const { matchday, matches, userPicks } = data || {};
  const now = new Date();
  const deadline = new Date(matchday?.deadline || new Date());
  const isExpired = now > deadline;

  // Create a map of user picks for easy lookup
  const pickMap = new Map();
  userPicks?.forEach((pick: any) => {
    pickMap.set(pick.matchId, pick);
  });

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

          return (
            <MatchCard
              key={match.id}
              match={match}
              userPick={userPick}
              isLocked={isMatchLocked || isExpired}
            />
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
