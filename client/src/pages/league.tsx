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
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-center">
        <p className="text-red-500">Lega non trovata</p>
        <Link href="/">
          <Button className="mt-4">Torna alla Home</Button>
        </Link>
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
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900" data-testid={`text-league-name`}>
          {league?.name || 'Lega'}
        </h1>
      </div>

      {/* League Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informazioni Lega</span>
            {isAdmin && <Badge variant="secondary">Admin</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Codice di invito:</span>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" data-testid="text-league-code">
                {league.code}
              </code>
              <Button size="icon" variant="ghost" onClick={copyLeagueCode} data-testid="button-copy-code">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Partecipanti:</span>
            <span className="font-semibold" data-testid="text-member-count">{members.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/leaderboard/${leagueId}`}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center space-y-2" data-testid="button-view-leaderboard">
            <Trophy className="w-6 h-6" />
            <span className="text-sm">Classifica</span>
          </Button>
        </Link>

        {isAdmin && (
          <Link href={`/league/${leagueId}/create-matchday`}>
            <Button className="w-full h-auto py-4 flex flex-col items-center space-y-2" data-testid="button-create-matchday">
              <Plus className="w-6 h-6" />
              <span className="text-sm">Nuova Giornata</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Pre-Season Predictions Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Link href={`/leagues/${leagueId}/pre-season-predictions`}>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Pronostici Pre-stagione</h4>
                  <p className="text-sm text-gray-500">Vincitore, Ultima, Capocannoniere</p>
                </div>
              </div>
              <div className="text-primary font-medium text-sm">→</div>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Supercoppa Italiana Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Link href={`/leagues/${leagueId}/supercoppa-predictions`}>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2">
              <div className="flex items-center space-x-3">
                <Trophy className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Supercoppa Italiana</h4>
                  <p className="text-sm text-gray-500">Finalisti e Vincitore</p>
                </div>
              </div>
              <div className="text-primary font-medium text-sm">→</div>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Matchdays */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Giornate</h3>
        {matchdays && matchdays.length > 0 ? (
          <div className="space-y-3">
            {matchdays.map((matchday: any) => (
              <Link key={matchday.id} href={`/matchday/${matchday.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-matchday-${matchday.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{matchday.name}</h4>
                      <Badge variant={matchday.isCompleted ? "default" : "secondary"}>
                        {matchday.isCompleted ? "Completata" : "In corso"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="text-gray-500">Clicca per vedere le partite</span>
                      <span className="text-primary font-medium">Visualizza →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nessuna giornata creata ancora</p>
              {isAdmin && (
                <Link href={`/league/${leagueId}/create-matchday`}>
                  <Button data-testid="button-create-first-matchday">
                    Crea la prima giornata
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Members */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Partecipanti</h3>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between" data-testid={`member-${member.user.id}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {member.user.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{member.user.nickname}</span>
                      {member.userId === league.adminId && (
                        <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString("it-IT")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}