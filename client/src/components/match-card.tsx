import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPick } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Match, Pick, User } from "@/lib/api";
import { Link } from "wouter";

interface MatchCardProps {
  match: Match;
  userPick?: Pick;
  isLocked: boolean;
  user?: User;
}

export default function MatchCard({ match, userPick, isLocked, user }: MatchCardProps) {
  const [selectedPick, setSelectedPick] = useState(userPick?.pick || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitPickMutation = useMutation({
    mutationFn: (pick: string) => submitPick(match.id, pick),
    onSuccess: () => {
      toast({
        title: "Pronostico salvato",
        description: "Il tuo pronostico è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matchdays"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio del pronostico.",
        variant: "destructive",
      });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async (result: string) => {
      const response = await fetch(`/api/matches/${match.id}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ result }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante l\'aggiornamento del risultato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Risultato aggiornato",
        description: "Il risultato della partita è stato aggiornato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matchdays"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del risultato.",
        variant: "destructive",
      });
    },
  });

  const handlePickSelect = (pick: string) => {
    if (isLocked) return;

    setSelectedPick(pick);
    submitPickMutation.mutate(pick);
  };

  const handleResultUpdate = (result: string) => {
    updateResultMutation.mutate(result);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cardContent = (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${
        isLocked ? "opacity-75" : ""
      }`}
      data-testid={`match-card-${match.id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500" data-testid={`match-time-${match.id}`}>
          {formatTime(match.kickoff)}
        </div>
        <div className={`text-xs font-medium ${isLocked ? "text-red-600" : "text-primary"}`}>
          {isLocked ? "Chiuso" : "Aperto"}
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-lg font-bold text-gray-900 mb-1" data-testid={`match-teams-${match.id}`}>
          {match.homeTeam} vs {match.awayTeam}
        </div>
        <div className="text-sm text-gray-500">Serie A</div>
      </div>

      {/* Pick Selection - only show when not locked */}
      {!isLocked && (
        <>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button
              variant={selectedPick === "1" ? "default" : "outline"}
              className={`py-3 px-4 font-semibold transition-all ${
                selectedPick === "1"
                  ? "bg-primary text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => handlePickSelect("1")}
              disabled={submitPickMutation.isPending}
              data-testid={`pick-1-${match.id}`}
            >
              <div className="text-lg">1</div>
            </Button>

            <Button
              variant={selectedPick === "X" ? "default" : "outline"}
              className={`py-3 px-4 font-semibold transition-all ${
                selectedPick === "X"
                  ? "bg-primary text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => handlePickSelect("X")}
              disabled={submitPickMutation.isPending}
              data-testid={`pick-X-${match.id}`}
            >
              <div className="text-lg">X</div>
            </Button>

            <Button
              variant={selectedPick === "2" ? "default" : "outline"}
              className={`py-3 px-4 font-semibold transition-all ${
                selectedPick === "2"
                  ? "bg-primary text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => handlePickSelect("2")}
              disabled={submitPickMutation.isPending}
              data-testid={`pick-2-${match.id}`}
            >
              <div className="text-lg">2</div>
            </Button>
          </div>

          {userPick && (
            <div className="mt-2 text-center">
              <span className="text-xs text-gray-500">
                Ultima modifica: {new Date(userPick.lastModified).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          )}
        </>
      )}

      {/* Current Result Display - show when locked */}
      {isLocked && match.result && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-500 mb-2">Risultato finale:</div>
          <div className={`inline-block px-3 py-2 rounded text-lg font-bold ${
            match.result === "1" ? "bg-blue-100 text-blue-800" :
            match.result === "X" ? "bg-gray-100 text-gray-800" :
            "bg-red-100 text-red-800"
          }`}>
            {match.result}
          </div>
        </div>
      )}

      {/* Admin Result Update - only show for admins when locked and no result yet */}
      {isLocked && user?.isAdmin && !match.result && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 text-center mb-3">
            Inserisci il risultato finale:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="py-2 px-4 font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              onClick={() => handleResultUpdate("1")}
              disabled={updateResultMutation.isPending}
              data-testid={`result-1-${match.id}`}
            >
              <div className="text-lg">1</div>
            </Button>

            <Button
              variant="outline"
              className="py-2 px-4 font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
              onClick={() => handleResultUpdate("X")}
              disabled={updateResultMutation.isPending}
              data-testid={`result-X-${match.id}`}
            >
              <div className="text-lg">X</div>
            </Button>

            <Button
              variant="outline"
              className="py-2 px-4 font-semibold bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              onClick={() => handleResultUpdate("2")}
              disabled={updateResultMutation.isPending}
              data-testid={`result-2-${match.id}`}
            >
              <div className="text-lg">2</div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return isLocked ? (
    <Link href={`/matches/${match.id}`} passHref>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}