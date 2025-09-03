
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Trophy, Medal, Award, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Leaderboard() {
  const [, params] = useRoute("/leaderboard/:leagueId");
  const leagueId = params?.leagueId;
  const queryClient = useQueryClient();
  const [editingPoints, setEditingPoints] = useState<Record<string, string>>({});

  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });
  const user = (authData as any)?.user;

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId, "leaderboard"],
    enabled: !!leagueId,
  });

  const { data: leagueData } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  const { data: manualPointsData } = useQuery({
    queryKey: ["/api/leagues", leagueId, "manual-points"],
    enabled: !!leagueId,
  });

  const updateManualPointsMutation = useMutation({
    mutationFn: async ({ userId, points }: { userId: string; points: number }) => {
      const response = await fetch(`/api/leagues/${leagueId}/manual-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points }),
      });
      if (!response.ok) throw new Error("Failed to update manual points");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "manual-points"] });
    },
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
            <div className="h-12 bg-gray-200 rounded-3xl"></div>
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded-2xl"></div>
              <div className="h-16 bg-gray-200 rounded-2xl"></div>
              <div className="h-16 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardData || !leagueData) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-sm relative z-10 text-center">
          <p className="text-secondary font-medium">Dati non disponibili</p>
          <Link href="/">
            <Button className="mt-4 retro-green-gradient retro-button rounded-xl text-white border-0 font-bold">
              Torna alla Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const league = (leagueData as any)?.league;
  const isAdmin = user && league && user.id === league.adminId;
  const manualPoints = manualPointsData || {};

  // Ensure leaderboardData is always an array
  const leaderboardArray = Array.isArray(leaderboardData) ? leaderboardData : [];

  const handleManualPointsChange = (userId: string, value: string) => {
    setEditingPoints(prev => ({ ...prev, [userId]: value }));
  };

  const handleManualPointsSubmit = (userId: string) => {
    const value = editingPoints[userId];
    if (value !== undefined) {
      const points = parseInt(value, 10);
      if (!isNaN(points)) {
        updateManualPointsMutation.mutate({ userId, points });
        setEditingPoints(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      }
    }
  };

  const handleQuickAdjust = (userId: string, delta: number) => {
    const currentPoints = manualPoints[userId] || 0;
    const newPoints = Math.max(0, currentPoints + delta);
    updateManualPointsMutation.mutate({ userId, points: newPoints });
  };

  return (
    <div className="min-h-screen paper-texture">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Header Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="retro-green-gradient p-6 text-white">
              <div className="flex items-center">
                <Link href={`/league/${leagueId}`}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="mr-3 text-white hover:bg-white/20 rounded-xl" 
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold retro-title">Classifica</h1>
                  <p className="text-green-100 text-sm font-medium" data-testid="text-league-name">
                    {league.name}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Podium */}
        {leaderboardArray?.length >= 3 && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 items-end">
                {/* 2nd Place */}
                {leaderboardArray?.[1] && (
                  <div className="text-center" data-testid="podium-2nd">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-gray-700">2°</span>
                    </div>
                    <div className="font-bold text-primary text-sm">{leaderboardArray?.[1]?.user?.nickname}</div>
                    <div className="text-xs text-primary/70 font-medium">{leaderboardArray?.[1]?.points} punti</div>
                  </div>
                )}

                {/* 1st Place */}
                <div className="text-center" data-testid="podium-1st">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-yellow-800">1°</span>
                  </div>
                  <div className="font-bold text-primary">{leaderboardArray?.[0]?.user?.nickname}</div>
                  <div className="text-sm text-primary/70 font-medium">{leaderboardArray?.[0]?.points} punti</div>
                </div>

                {/* 3rd Place */}
                {leaderboardArray?.[2] && (
                  <div className="text-center" data-testid="podium-3rd">
                    <div className="w-14 h-14 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-white">3°</span>
                    </div>
                    <div className="font-bold text-primary text-sm">{leaderboardArray?.[2]?.user?.nickname}</div>
                    <div className="text-xs text-primary/70 font-medium">{leaderboardArray?.[2]?.points} punti</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full leaderboard */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-primary retro-title">Classifica Completa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-primary/10">
              {leaderboardArray?.map((player: any, index: number) => (
                <div 
                  key={player.user.id} 
                  className={`px-6 py-4 flex items-center justify-between ${
                    player.points === 0 ? "bg-gray-50/50" : ""
                  }`}
                  data-testid={`leaderboard-row-${index + 1}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-8 text-center font-bold text-lg ${
                      player.points === 0 ? "text-primary/50" : "text-primary"
                    }`}>
                      {index + 1}°
                    </span>
                    <span className={`font-bold ${
                      player.points === 0 ? "text-primary/60" : "text-primary"
                    }`}>
                      {player.user.nickname}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      player.points === 0 ? "text-primary/60" : "text-primary"
                    }`}>
                      {player.points} punti
                    </div>
                    <div className={`text-xs font-medium ${
                      player.points === 0 ? "text-primary/50" : "text-primary/70"
                    }`}>
                      {player.points === 0 ? "Nessun pronostico" : `${player.correctPicks} giusti`}
                      {player.manualPoints && player.manualPoints > 0 && (
                        <span className="text-blue-600 ml-1">+{player.manualPoints} manuali</span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="mt-2 flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleQuickAdjust(player.user.id, -1)}
                          disabled={updateManualPointsMutation.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        {editingPoints[player.user.id] !== undefined ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={editingPoints[player.user.id]}
                              onChange={(e) => handleManualPointsChange(player.user.id, e.target.value)}
                              className="h-6 w-12 p-1 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleManualPointsSubmit(player.user.id);
                                if (e.key === 'Escape') setEditingPoints(prev => {
                                  const newState = { ...prev };
                                  delete newState[player.user.id];
                                  return newState;
                                });
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2"
                              onClick={() => handleManualPointsSubmit(player.user.id)}
                              disabled={updateManualPointsMutation.isPending}
                            >
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleManualPointsChange(player.user.id, String(manualPoints[player.user.id] || 0))}
                          >
                            {manualPoints[player.user.id] || 0}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleQuickAdjust(player.user.id, 1)}
                          disabled={updateManualPointsMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {(!leaderboardArray || leaderboardArray.length === 0) && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-primary/50 mx-auto mb-4" />
              <p className="text-primary/70 font-medium">Nessun dato disponibile</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
