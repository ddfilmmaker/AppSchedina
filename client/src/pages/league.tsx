
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Calendar, Trophy, Plus, Copy, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function League() {
  const [, params] = useRoute("/league/:id");
  const leagueId = params?.id;
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId,
  });

  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });
  const user = (authData as any)?.user;

  // Ensure data has the expected structure
  const league = (data as any)?.league;
  const members = (data as any)?.members || [];
  const matchdays = (data as any)?.matchdays || [];

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

  if (!data) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-sm relative z-10 text-center">
          <Card className="retro-card border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <p className="text-primary font-medium mb-4">Lega non trovata</p>
              <Link href="/">
                <Button className="retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg">
                  Torna alla Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAdmin = user?.id === league?.adminId;

  const copyLeagueCode = () => {
    if (league?.code) {
      navigator.clipboard.writeText(league.code);
      toast({
        title: "Codice copiato",
        description: "Il codice della lega è stato copiato negli appunti",
      });
    }
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Link href="/">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mr-3 text-white hover:bg-white/20 rounded-xl" 
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </Button>
                  </Link>
                  <h1 className="text-xl font-bold retro-title" data-testid="text-league-name">
                    {league?.name || 'Lega'}
                  </h1>
                </div>
                {isAdmin && (
                  <Badge className="bg-white/20 text-white border-0 font-bold">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* League Info Card */}
        <Card className="retro-card border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-primary">
              Informazioni Lega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary/70 font-medium">Codice di invito:</span>
              <div className="flex items-center space-x-2">
                <code className="bg-primary/10 px-3 py-1 rounded-xl text-sm font-mono font-bold text-primary" data-testid="text-league-code">
                  {league.code}
                </code>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={copyLeagueCode} 
                  className="h-8 w-8 rounded-xl hover:bg-primary/10" 
                  data-testid="button-copy-code"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary/70 font-medium">Partecipanti:</span>
              <span className="font-bold text-primary" data-testid="text-member-count">{members.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/leaderboard/${leagueId}`}>
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 retro-button rounded-2xl p-4 flex flex-col items-center space-y-2 text-white border-0 shadow-lg h-auto font-bold" data-testid="button-view-leaderboard">
              <Trophy className="w-6 h-6" />
              <span className="text-sm font-medium">Classifica</span>
            </Button>
          </Link>

          {isAdmin ? (
            <Link href={`/league/${leagueId}/create-matchday`}>
              <Button className="w-full retro-green-gradient retro-button rounded-2xl p-4 flex flex-col items-center space-y-2 text-white border-0 shadow-lg h-auto font-bold" data-testid="button-create-matchday">
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">Nuova Giornata</span>
              </Button>
            </Link>
          ) : (
            <div className="w-full bg-gray-100 rounded-2xl p-4 flex flex-col items-center space-y-2 opacity-50">
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-400">Solo Admin</span>
            </div>
          )}
        </div>

        {/* Special Predictions Section */}
        <div className="space-y-3">
          {/* Pre-Season Predictions Card */}
          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <Link href={`/leagues/${leagueId}/pre-season-predictions`}>
                <div className="flex items-center justify-between cursor-pointer hover:bg-primary/5 rounded-xl p-2 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">Pronostici Pre-stagione</h4>
                      <p className="text-sm text-primary/70 font-medium">Vincitore, Ultima, Capocannoniere</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Supercoppa Italiana Card */}
          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <Link href={`/leagues/${leagueId}/supercoppa-predictions`}>
                <div className="flex items-center justify-between cursor-pointer hover:bg-primary/5 rounded-xl p-2 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">Supercoppa Italiana</h4>
                      <p className="text-sm text-primary/70 font-medium">Finalisti e Vincitore</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Coppa Italia Card */}
          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <Link href={`/leagues/${leagueId}/coppa-italia-predictions`}>
                <div className="flex items-center justify-between cursor-pointer hover:bg-primary/5 rounded-xl p-2 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 retro-green-gradient rounded-xl flex items-center justify-center shadow-md">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">Coppa Italia</h4>
                      <p className="text-sm text-primary/70 font-medium">Vincitrice finale</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Matchdays Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary retro-title">Giornate</h3>
            <span className="text-sm text-primary/70 font-medium">
              {matchdays?.length || 0} giornate
            </span>
          </div>
          
          {matchdays && matchdays.length > 0 ? (
            <div className="space-y-3">
              {matchdays.map((matchday: any) => (
                <Link key={matchday.id} href={`/matchday/${matchday.id}`}>
                  <Card className="retro-card border-0 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden" data-testid={`card-matchday-${matchday.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-primary">{matchday.name}</h4>
                          <p className="text-sm text-primary/70 font-medium">Clicca per vedere le partite</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={`mb-2 font-bold ${
                              matchday.isCompleted 
                                ? "bg-gradient-to-r from-success to-accent text-white border-0" 
                                : "bg-primary/10 text-primary border-0"
                            }`}
                          >
                            {matchday.isCompleted ? "Completata" : "In corso"}
                          </Badge>
                          <div className="text-primary font-bold text-sm">
                            Visualizza →
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="retro-card border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 text-primary/50 mx-auto mb-6" />
                <p className="text-primary/70 mb-6 font-medium text-lg">Nessuna giornata creata ancora</p>
                {isAdmin && (
                  <Link href={`/league/${leagueId}/create-matchday`}>
                    <Button 
                      className="retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold shadow-lg" 
                      data-testid="button-create-first-matchday"
                    >
                      Crea la prima giornata
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Members Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary retro-title">Partecipanti</h3>
            <span className="text-sm text-primary/70 font-medium">
              {members.length} membri
            </span>
          </div>
          
          <Card className="retro-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-4">
                {members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between" data-testid={`member-${member.user.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 retro-green-gradient rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">
                          {member.user.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-primary">{member.user.nickname}</span>
                        {member.userId === league.adminId && (
                          <Badge className="ml-2 text-xs bg-primary/10 text-primary border-0 font-bold">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-primary/70 font-medium">
                      {new Date(member.joinedAt).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
