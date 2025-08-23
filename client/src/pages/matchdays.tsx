
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Matchdays() {
  const { data: leagues } = useQuery({
    queryKey: ["/api/leagues"],
  });

  const leaguesArray = Array.isArray(leagues) ? leagues : [];

  // Get all matchdays from all leagues
  const allMatchdays = leaguesArray.flatMap((league: any) => 
    (league.matchdays || []).map((matchday: any) => ({
      ...matchday,
      leagueName: league.name,
      leagueId: league.id
    }))
  );

  // Sort by deadline
  const sortedMatchdays = allMatchdays.sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // Helper functions removed since deadlines are now per-match

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">I miei Pronostici</h1>

      {sortedMatchdays.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Nessuna giornata disponibile</p>
          <p className="text-sm text-gray-400">
            Unisciti a una lega per vedere le giornate
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMatchdays.map((matchday: any) => (
            <Link key={matchday.id} href={`/matchday/${matchday.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{matchday.name}</CardTitle>
                    <Badge variant={matchday.isCompleted ? "secondary" : "default"}>
                      {matchday.isCompleted ? "Completata" : "Attiva"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{matchday.leagueName}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Scadenze per singola partita</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
