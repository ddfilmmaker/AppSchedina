import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users, TrendingUp, Trophy, Award, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });
  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ["/api/leagues"],
  });

  const user = (authData as any)?.user;

  // Ensure leagues is always an array
  const leaguesArray = Array.isArray(leagues) ? leagues : [];

  if (leaguesLoading) {
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
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = leaguesArray?.reduce((sum: number, league: any) => sum + (league.userPoints || 0), 0) || 0;
  const totalCorrectPicks = Math.floor(totalPoints * 0.8); // Approximation

  return (
    <div className="min-h-screen paper-texture">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>
      
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6 relative z-10">
      {/* Welcome Section */}
      <Card className="retro-card border-0 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="retro-green-gradient p-6 text-white">
            <h2 className="text-xl font-bold mb-2 retro-title">
              Benvenuto, <span data-testid="text-username">{user?.nickname}</span>!
            </h2>
            <p className="text-green-100 text-sm font-medium">Pronti per la prossima giornata?</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-points">{totalPoints}</div>
                <div className="text-xs text-green-200">Punti Totali</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-correct-picks">{totalCorrectPicks}</div>
                <div className="text-xs text-green-200">Pronostici Giusti</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/create-league">
          <Button 
            className="w-full retro-red-gradient retro-button rounded-2xl p-4 flex flex-col items-center space-y-2 text-white border-0 shadow-lg h-auto font-bold"
            data-testid="button-create-league"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Crea Lega</span>
          </Button>
        </Link>

        <Link href="/join-league">
          <Button 
            className="w-full retro-green-gradient retro-button rounded-2xl p-4 flex flex-col items-center space-y-2 text-white border-0 shadow-lg h-auto font-bold"
            data-testid="button-join-league"
          >
            <Users className="w-6 h-6" />
            <span className="text-sm font-medium">Unisciti</span>
          </Button>
        </Link>
      </div>

      {/* Le Mie Leghe Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary retro-title">Le Mie Leghe</h3>
          <span className="text-sm text-primary/70 font-medium" data-testid="text-leagues-count">
            {leaguesArray?.length || 0} leghe
          </span>
        </div>

        {leaguesArray && leaguesArray.length > 0 ? (
          <div className="space-y-3">
            {leaguesArray.map((league: any) => (
              <Link key={league.id} href={`/league/${league.id}`}>
                <Card className="retro-card border-0 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden" data-testid={`card-league-${league.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-primary" data-testid={`text-league-name-${league.id}`}>
                          {league.name}
                        </h4>
                        <p className="text-sm text-primary/70 font-medium">
                          {league.memberCount} partecipanti
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-secondary" data-testid={`text-league-position-${league.id}`}>
                          {league.userPosition}°
                        </div>
                        <div className="text-xs text-primary/70 font-medium">
                          {league.userPoints} punti
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="bg-gradient-to-r from-success to-accent text-white text-xs px-3 py-1 rounded-full font-bold">
                          Attiva
                        </span>
                      </div>
                      <span className="text-primary text-sm font-bold">
                        Visualizza →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <p className="text-primary/70 mb-4 font-medium">Non sei ancora in nessuna lega</p>
              <div className="flex flex-col gap-6">
                <Link href="/create-league">
                  <Button className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold" data-testid="button-create-first-league">
                    Crea la tua prima lega
                  </Button>
                </Link>
                <Link href="/join-league">
                  <Button className="w-full retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold" data-testid="button-join-first-league">
                    Unisciti a una lega
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-primary retro-title mb-4">Attività Recente</h3>
        <div className="space-y-3">
          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 retro-green-gradient rounded-full flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      Benvenuto in Schedina!
                    </p>
                    <p className="text-xs text-primary/70 font-medium">Inizia creando o unendoti a una lega</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}