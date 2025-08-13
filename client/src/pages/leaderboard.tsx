import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Leaderboard() {
  const [, params] = useRoute("/leaderboard/:leagueId");
  const leagueId = params?.leagueId;

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId, "leaderboard"],
    enabled: !!leagueId,
  });

  const { data: leagueData } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardData || !leagueData) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-center">
        <p className="text-red-500">Dati non disponibili</p>
        <Link href="/">
          <Button className="mt-4">Torna alla Home</Button>
        </Link>
      </div>
    );
  }

  const league = (leagueData as any)?.league;

  // Ensure leaderboardData is always an array
  const leaderboardArray = Array.isArray(leaderboardData) ? leaderboardData : [];

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Classifica</h1>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1" data-testid="text-league-name">
            {league.name}
          </h2>
          <p className="text-sm text-gray-500">Classifica generale</p>
        </CardContent>
      </Card>

      {/* Podium */}
      {leaderboardArray?.length >= 3 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-yellow-200 p-6">
          <div className="grid grid-cols-3 gap-4 items-end">
            {/* 2nd Place */}
            {leaderboardArray?.[1] && (
              <div className="text-center" data-testid="podium-2nd">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-700">2°</span>
                </div>
                <div className="font-semibold text-gray-900">{leaderboardArray?.[1]?.user?.nickname}</div>
                <div className="text-sm text-gray-600">{leaderboardArray?.[1]?.points} punti</div>
              </div>
            )}
            
            {/* 1st Place */}
            <div className="text-center" data-testid="podium-1st">
              <div className="w-20 h-20 bg-accent rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-xl font-bold text-yellow-800">1°</span>
              </div>
              <div className="font-bold text-gray-900">{leaderboardArray?.[0]?.user?.nickname}</div>
              <div className="text-sm text-gray-600">{leaderboardArray?.[0]?.points} punti</div>
            </div>
            
            {/* 3rd Place */}
            {leaderboardArray?.[2] && (
              <div className="text-center" data-testid="podium-3rd">
                <div className="w-14 h-14 bg-amber-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">3°</span>
                </div>
                <div className="font-semibold text-gray-900">{leaderboardArray?.[2]?.user?.nickname}</div>
                <div className="text-sm text-gray-600">{leaderboardArray?.[2]?.points} punti</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Classifica Completa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {leaderboardArray?.map((player: any, index: number) => (
              <div 
                key={player.user.id} 
                className={`px-4 py-3 flex items-center justify-between ${
                  player.points === 0 ? "bg-gray-50" : ""
                }`}
                data-testid={`leaderboard-row-${index + 1}`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 text-center font-semibold ${
                    player.points === 0 ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {index + 1}°
                  </span>
                  <span className={`font-medium ${
                    player.points === 0 ? "text-gray-500" : "text-gray-900"
                  }`}>
                    {player.user.nickname}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    player.points === 0 ? "text-gray-500" : "text-gray-900"
                  }`}>
                    {player.points} punti
                  </div>
                  <div className={`text-xs ${
                    player.points === 0 ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {player.points === 0 ? "Nessun pronostico" : `${player.correctPicks} giusti`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(!leaderboardArray || leaderboardArray.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun dato disponibile</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
