
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
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Le mie Leghe</h1>
        <Link href="/create-league">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Crea
          </Button>
        </Link>
      </div>

      {leaguesArray.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Non fai parte di nessuna lega</p>
          <div className="space-y-2">
            <Link href="/create-league">
              <Button className="w-full">Crea una lega</Button>
            </Link>
            <Link href="/join-league">
              <Button variant="outline" className="w-full">
                Unisciti a una lega
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leaguesArray.map((league: any) => (
            <Link key={league.id} href={`/league/${league.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{league.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{league.memberCount || 0} membri</span>
                    <span>{league.matchdayCount || 0} giornate</span>
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
