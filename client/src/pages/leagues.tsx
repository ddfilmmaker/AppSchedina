
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Leagues() {
  const { data: leagues, isLoading } = useQuery({
    queryKey: ["/api/leagues"],
  });

  const leaguesArray = Array.isArray(leagues) ? leagues : [];

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
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold retro-title">Le mie Leghe</h1>
                <Link href="/create-league">
                  <Button 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl font-bold shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crea
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

      {leaguesArray.length === 0 ? (
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-primary/50 mb-6" />
            <p className="text-primary/70 mb-6 font-medium text-lg">Non fai parte di nessuna lega</p>
            <div className="space-y-4">
              <Link href="/create-league">
                <Button className="w-full retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg">
                  Crea una lega
                </Button>
              </Link>
              <Link href="/join-league">
                <Button className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg">
                  Unisciti a una lega
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaguesArray.map((league: any) => (
            <Link key={league.id} href={`/league/${league.id}`}>
              <Card className="retro-card border-0 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-primary text-lg">{league.name}</h4>
                      <p className="text-sm text-primary/70 font-medium">
                        {league.memberCount || 0} membri
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-primary text-sm font-bold">
                        Visualizza →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
