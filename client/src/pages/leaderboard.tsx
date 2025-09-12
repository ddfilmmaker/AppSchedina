import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Trophy, Medal, Award, Plus, Minus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Leaderboard() {
  const [, params] = useRoute("/leaderboard/:leagueId");
  const leagueId = params?.leagueId;
  const [manualPointsInputs, setManualPointsInputs] = useState<Record<string, number>>({});
  const [showManualTiebreak, setShowManualTiebreak] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const [tiedUsers, setTiedUsers] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId, "leaderboard"],
    enabled: !!leagueId,
  });

  const { data: leagueData } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });

  // Query for winner data
  const { data: winnerData } = useQuery({
    queryKey: ["/api/leagues", leagueId, "winner"],
    enabled: !!leagueId,
    retry: false,
  });

  const updateManualPointsMutation = useMutation({
    mutationFn: async ({ userId, points }: { userId: string; points: number }) => {
      const response = await fetch(`/api/leagues/${leagueId}/manual-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, points }),
      });

      if (!response.ok) {
        throw new Error('Failed to update manual points');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch leaderboard data
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "leaderboard"] });
      // Also refetch user leagues to update home page totals
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
    },
  });

  const declareWinnerMutation = useMutation({
    mutationFn: async ({ winnerUserId }: { winnerUserId?: string }) => {
      const response = await fetch(`/api/leagues/${leagueId}/declare-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.JSONstringify({ winnerUserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.method === 'clear_leader' || data.method === 'tiebreak' || data.method === 'manual') {
        toast({
          title: "Vincitore dichiarato!",
          description: data.detail,
        });
        setShowManualTiebreak(false);
        setSelectedWinner("");
        setTiedUsers([]);
      }
      // Refetch winner data
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "winner"] });
    },
    onError: (error: any) => {
      if (error.requiresManualSelection) {
        setTiedUsers(error.tiedUsers);
        setShowManualTiebreak(true);
        toast({
          title: "Parità rilevata",
          description: error.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: error.error || "Errore nella dichiarazione del vincitore",
          variant: "destructive",
        });
      }
    },
  });

  // Ensure leaderboardData is always an array
  const leaderboardArray = Array.isArray(leaderboardData) ? leaderboardData : [];

  // Initialize manual points inputs with current values
  React.useEffect(() => {
    if (leaderboardArray.length > 0) {
      const initialInputs: Record<string, number> = {};
      leaderboardArray.forEach((player: any) => {
        initialInputs[player.user.id] = player.manualPoints || 0;
      });
      setManualPointsInputs(initialInputs);
    }
  }, [leaderboardArray]);

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

  const updateManualPoints = (userId: string, points: number) => {
    updateManualPointsMutation.mutate({ userId, points });
  };

  const adjustManualPoints = (userId: string, delta: number) => {
    const currentPoints = manualPointsInputs[userId] || 0;
    const newPoints = Math.max(0, currentPoints + delta);
    setManualPointsInputs(prev => ({ ...prev, [userId]: newPoints }));
    updateManualPoints(userId, newPoints);
  };

  const handleManualPointsInput = (userId: string, value: string) => {
    const points = Math.max(0, parseInt(value) || 0);
    setManualPointsInputs(prev => ({ ...prev, [userId]: points }));
    updateManualPoints(userId, points);
  };

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
  const user = (authData as any)?.user;
  const isAdmin = user && league && league.adminId === user.id;

  // Find winner user from leaderboard if winner is declared
  const winnerInfo = winnerData as { winnerUserId: string; declaredAt: string; description: string } | null | undefined;
  const winnerUser = winnerInfo?.winnerUserId ?
    leaderboardArray.find((player: any) => player.user.id === winnerInfo.winnerUserId)?.user : null;

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

        {/* Winner Banner */}
        {winnerUser && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div className="text-center">
                  <div className="font-bold text-lg text-primary">
                    🏆 Vincitore: {winnerUser.nickname}
                  </div>
                  <div className="text-sm text-primary/70">
                    {winnerInfo?.description}
                  </div>
                  {winnerInfo?.declaredAt && (
                    <div className="text-xs text-primary/50 mt-1">
                      Dichiarato il {new Date(winnerInfo.declaredAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Winner Declaration */}
        {isAdmin && !winnerUser && (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-bold text-primary mb-2">Amministratore</h3>
                  <p className="text-sm text-primary/70 mb-4">
                    Dichiara il vincitore della lega
                  </p>
                </div>

                {showManualTiebreak ? (
                  <div className="space-y-4">
                    <p className="text-sm text-primary/70">
                      Parità rilevata. Seleziona manualmente il vincitore:
                    </p>
                    <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona il vincitore" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiedUsers.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.nickname} ({user.points} punti)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex space-x-3">
                      <Button
                        className="flex-1 retro-green-gradient retro-button rounded-xl text-white border-0 font-bold"
                        onClick={() => declareWinnerMutation.mutate({ winnerUserId: selectedWinner })}
                        disabled={!selectedWinner || declareWinnerMutation.isPending}
                        data-testid="button-confirm-winner"
                      >
                        {declareWinnerMutation.isPending ? "Dichiarazione..." : "Conferma"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowManualTiebreak(false);
                          setTiedUsers([]);
                          setSelectedWinner("");
                        }}
                        data-testid="button-cancel-tiebreak"
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="retro-green-gradient retro-button rounded-xl text-white border-0 font-bold px-8"
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={declareWinnerMutation.isPending || leaderboardArray.length === 0}
                          data-testid="button-declare-winner"
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          {declareWinnerMutation.isPending ? "Dichiarazione..." : "Dichiara vincitore"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sei Sicuro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler dichiarare il vincitore? Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            className="retro-green-gradient retro-button rounded-xl text-white border-0 font-bold"
                            onClick={() => {
                              declareWinnerMutation.mutate({});
                              setShowConfirmDialog(false);
                            }}
                          >
                            Conferma
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                  className={`px-6 py-4 ${
                    player.points === 0 ? "bg-gray-50/50" : ""
                  }`}
                  data-testid={`leaderboard-row-${index + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`w-8 text-center font-bold text-lg ${
                        player.points === 0 ? "text-primary/50" : "text-primary"
                      }`}>
                        {index + 1}°
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${
                          player.points === 0 ? "text-primary/60" : "text-primary"
                        }`}>
                          {player.user.nickname}
                        </span>
                        {winnerUser && player.user.id === winnerUser.id && (
                          <Crown className="w-5 h-5 text-yellow-500" data-testid="winner-crown" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className={`font-bold ${
                          player.points === 0 ? "text-primary/60" : "text-primary"
                        }`}>
                          {player.points} punti
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => adjustManualPoints(player.user.id, -1)}
                            disabled={updateManualPointsMutation.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={manualPointsInputs[player.user.id] || 0}
                            onChange={(e) => handleManualPointsInput(player.user.id, e.target.value)}
                            className="w-16 h-8 text-center text-sm"
                            disabled={updateManualPointsMutation.isPending}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => adjustManualPoints(player.user.id, 1)}
                            disabled={updateManualPointsMutation.isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {player.manualPoints && player.manualPoints > 0 && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      +{player.manualPoints} punti manuali
                    </div>
                  )}
                  {isAdmin && (
                    <div className="mt-1 text-xs text-gray-500">
                      {player.preseasonPoints ? `Preseason: +${player.preseasonPoints} ` : ''}
                      {player.supercoppaPoints ? `Supercoppa: +${player.supercoppaPoints} ` : ''}
                      {player.coppaPoints ? `Coppa: +${player.coppaPoints} ` : ''}
                      {player.manualPoints ? `Manuali: +${player.manualPoints} ` : ''}
                    </div>
                  )}
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