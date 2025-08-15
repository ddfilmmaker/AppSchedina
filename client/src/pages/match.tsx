import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MatchCard from "@/components/match-card";
import { useAuth } from "@/lib/auth";

export default function Match() {
  const [, params] = useRoute("/match/:id");
  const matchId = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/matches", matchId, "details"],
    enabled: !!matchId,
  });

  const { user } = useAuth(); // Added useAuth hook to get user information

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-center">
        <p className="text-red-500">Partita non trovata</p>
        <Link href="/">
          <Button className="mt-4">Torna alla Home</Button>
        </Link>
      </div>
    );
  }

  const { match, matchday, participants, pickForThisMatch, resultForThisMatch, matchdayTotals } = data as any;
  const now = new Date();
  const matchKickoff = new Date(match.kickoff);
  const isLocked = now > new Date(matchKickoff.getTime() - 60000); // 1 minute before kickoff

  // Find user's pick for this match
  const userPick = pickForThisMatch.find((p: any) => p.userId === data.userId);

  // Create maps for easy lookup
  const pickMap = new Map();
  pickForThisMatch.forEach((pick: any) => {
    pickMap.set(pick.userId, pick.value);
  });

  const totalsMap = new Map();
  matchdayTotals.forEach((total: any) => {
    totalsMap.set(total.userId, total.points);
  });

  // Calculate points for this specific match
  const getMatchPoints = (userId: string) => {
    if (!resultForThisMatch) return "-";
    const pick = pickMap.get(userId);
    return pick === resultForThisMatch ? "1" : "0";
  };

  // Function to handle updating the match result
  const handleUpdateResult = async (value: string) => {
    await fetch(`/api/matches/${match.id}/result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    });
    // Optionally re-fetch data or update local state
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center mb-6">
        <Link href={`/matchday/${match.matchdayId}`}>
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {match.homeTeam} vs {match.awayTeam}
        </h1>
      </div>

      {/* Match Header */}
      <MatchCard
        match={match}
        userPick={userPick ? { ...userPick, id: "user-pick", matchId: match.id, submittedAt: "", lastModified: "" } : undefined}
        isLocked={isLocked}
      />

      {/* Admin controls to update result */}
      {isLocked && user?.role === "admin" && ( // Show only if locked and user is admin
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aggiorna Risultato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              <Button onClick={() => handleUpdateResult("1")} className="w-1/3">1</Button>
              <Button onClick={() => handleUpdateResult("X")} className="w-1/3">X</Button>
              <Button onClick={() => handleUpdateResult("2")} className="w-1/3">2</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants Section - Only show after lock */}
      {isLocked && (
        <Card>
          <CardHeader className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Pronostici dei partecipanti
              </h3>
              <h3 className="text-sm font-semibold text-gray-700 text-center">
                Punti
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-64 overflow-y-auto">
              {participants.map((participant: any) => {
                const pick = pickMap.get(participant.id);
                const points = getMatchPoints(participant.id);
                return (
                  <div key={participant.id} className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100 last:border-b-0">
                    {/* Left 50% - Participant name and pick */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate mr-2">
                        {participant.nickname}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        pick === "1" ? "bg-blue-100 text-blue-800" :
                        pick === "X" ? "bg-gray-100 text-gray-800" :
                        pick === "2" ? "bg-red-100 text-red-800" :
                        "bg-gray-50 text-gray-400"
                      }`}>
                        {pick || "-"}
                      </span>
                    </div>

                    {/* Right 50% - Points */}
                    <div className="flex items-center justify-center">
                      <span className={`text-sm font-bold ${
                        points === "1" ? "text-green-600" :
                        points === "0" ? "text-red-500" :
                        "text-gray-400"
                      }`}>
                        {points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Summary - Sticky Footer */}
      {isLocked && (
        <Card className="fixed bottom-4 left-4 right-4 max-w-md mx-auto shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Punti giornata</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants
                .sort((a: any, b: any) => (totalsMap.get(b.id) || 0) - (totalsMap.get(a.id) || 0))
                .map((participant: any) => (
                  <div key={participant.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 truncate">
                      {participant.nickname}
                    </span>
                    <span className="font-bold text-gray-900">
                      {totalsMap.get(participant.id) || 0}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}