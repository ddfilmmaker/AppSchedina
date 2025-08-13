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
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = leaguesArray?.reduce((sum: number, league: any) => sum + (league.userPoints || 0), 0) || 0;
  const totalCorrectPicks = Math.floor(totalPoints * 0.8); // Approximation

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-green-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">
          Benvenuto, <span data-testid="text-username">{user?.nickname}</span>!
        </h2>
        <p className="text-green-100 text-sm">Pronti per la prossima giornata?</p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/create-league">
          <Button 
            className="w-full bg-secondary text-white rounded-lg p-4 flex flex-col items-center space-y-2 shadow-md hover:bg-red-700 transition-colors h-auto"
            data-testid="button-create-league"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Crea Lega</span>
          </Button>
        </Link>
        
        <Link href="/join-league">
          <Button 
            variant="outline"
            className="w-full border-2 border-primary text-primary rounded-lg p-4 flex flex-col items-center space-y-2 shadow-md hover:bg-primary hover:text-white transition-colors h-auto"
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
          <h3 className="text-lg font-bold text-gray-900">Le Mie Leghe</h3>
          <span className="text-sm text-gray-500" data-testid="text-leagues-count">
            {leaguesArray?.length || 0} leghe
          </span>
        </div>

        {leaguesArray && leaguesArray.length > 0 ? (
          <div className="space-y-3">
            {leaguesArray.map((league: any) => (
              <Link key={league.id} href={`/league/${league.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-league-${league.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900" data-testid={`text-league-name-${league.id}`}>
                          {league.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {league.memberCount} partecipanti
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary" data-testid={`text-league-position-${league.id}`}>
                          {league.userPosition}°
                        </div>
                        <div className="text-xs text-gray-500">
                          {league.userPoints} punti
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Attiva
                        </span>
                      </div>
                      <span className="text-primary text-sm font-medium">
                        Visualizza →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Non sei ancora in nessuna lega</p>
              <div className="space-y-2">
                <Link href="/create-league">
                  <Button className="w-full" data-testid="button-create-first-league">
                    Crea la tua prima lega
                  </Button>
                </Link>
                <Link href="/join-league">
                  <Button variant="outline" className="w-full" data-testid="button-join-first-league">
                    Unisciti a una lega
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Special Tournaments Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tornei Speciali</h3>
        <Link href="/special-tournaments">
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-amber-900">Pronostici Pre-Stagione</h4>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  Aperto
                </span>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                Vincitore Serie A, Ultimo posto, Capocannoniere
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600">Scadenza: 20 Agosto 2024</span>
                <span className="text-amber-800 text-sm font-medium">
                  Partecipa →
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-900">Coppa Italia</h4>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  In corso
                </span>
              </div>
              <p className="text-sm text-green-700 mb-3">Vincitore della Finale</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600">Scadenza: 15 Maggio 2024</span>
                <span className="text-green-800 text-sm font-medium">
                  Partecipa →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Attività Recente</h3>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Benvenuto in Schedina!
                    </p>
                    <p className="text-xs text-gray-500">Inizia creando o unendoti a una lega</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
