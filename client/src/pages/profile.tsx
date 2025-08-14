
import { useQuery } from "@tanstack/react-query";
import { User, LogOut, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });
  const { data: leagues } = useQuery({ queryKey: ["/api/leagues"] });

  const user = (authData as any)?.user;
  const leaguesArray = Array.isArray(leagues) ? leagues : [];

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        setLocation("/auth");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center">
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  const totalPoints = leaguesArray.reduce((sum: number, league: any) => sum + (league.userPoints || 0), 0);
  const leagueCount = leaguesArray.length;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold">{user.nickname}</h1>
        <p className="text-gray-500">Membro dal {new Date(user.createdAt).toLocaleDateString('it-IT')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Trophy className="w-4 h-4 mr-2" />
              Punti Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{totalPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Leghe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{leagueCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Leghe partecipate:</span>
              <span className="font-medium">{leagueCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Punti totali:</span>
              <span className="font-medium">{totalPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Media punti per lega:</span>
              <span className="font-medium">
                {leagueCount > 0 ? (totalPoints / leagueCount).toFixed(1) : "0"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Esci
        </Button>
      </div>
    </div>
  );
}
