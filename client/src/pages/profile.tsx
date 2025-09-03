
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
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center">
            <p className="text-primary font-medium">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = leaguesArray.reduce((sum: number, league: any) => sum + (league.userPoints || 0), 0);
  const leagueCount = leaguesArray.length;

  return (
    <div className="min-h-screen paper-texture">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Profile Header Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="retro-green-gradient p-8 text-white text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold retro-title mb-2">{user.nickname}</h1>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center text-primary font-bold">
                <Trophy className="w-4 h-4 mr-2" />
                Punti Totali
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-secondary">{totalPoints}</p>
            </CardContent>
          </Card>

          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center text-primary font-bold">
                <Target className="w-4 h-4 mr-2" />
                Leghe
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-secondary">{leagueCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pt-6 px-6">
            <CardTitle className="text-lg text-primary retro-title">Statistiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="flex justify-between items-center">
              <span className="text-primary/70 font-medium">Leghe partecipate:</span>
              <span className="font-bold text-primary">{leagueCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-primary/70 font-medium">Punti totali:</span>
              <span className="font-bold text-primary">{totalPoints}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-primary/70 font-medium">Media punti per lega:</span>
              <span className="font-bold text-primary">
                {leagueCount > 0 ? (totalPoints / leagueCount).toFixed(1) : "0"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          className="w-full retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Esci
        </Button>
      </div>
    </div>
  );
}
