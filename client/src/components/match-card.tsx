import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPick } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Match, Pick, User } from "@/lib/api";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  match: Match;
  userPick?: Pick;
  isLocked: boolean;
  user?: User;
  matchDeadline?: string;
}

export default function MatchCard({ match, userPick, isLocked, user, matchDeadline }: MatchCardProps) {
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

  // Admin result update mutation
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
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
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
    // Removed isLocked check here as we rely on canEditPick
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

  // Define deadline and related states
  const deadline = matchDeadline || match.deadline || match.kickoff;
  const isDeadlinePassed = new Date() > new Date(deadline);
  const canSubmitPicks = !isDeadlinePassed;
  const hasUserPick = userPick !== undefined;
  const showResult = isDeadlinePassed && match.result;
  const canEditPick = !isDeadlinePassed; // Users can edit until match deadline passes
  
  console.log(`MatchCard ${match.homeTeam} vs ${match.awayTeam}: deadline=${deadline}, isDeadlinePassed=${isDeadlinePassed}, showResult=${showResult}`);es

  const cardContent = (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${
        isDeadlinePassed ? "opacity-75" : ""
      }`}
      data-testid={`match-card-${match.id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500" data-testid={`match-time-${match.id}`}>
          {formatTime(match.kickoff)}
        </div>
        <div className={`text-xs font-medium ${isDeadlinePassed ? "text-red-600" : "text-primary"}`}>
          {isDeadlinePassed ? "Chiuso" : "Aperto"}
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-lg font-bold text-gray-900 mb-1" data-testid={`match-teams-${match.id}`}>
          {match.homeTeam} vs {match.awayTeam}
        </div>
        <div className="text-sm text-gray-500">Serie A</div>
      </div>

      {/* Pick Selection - only show when canEditPick is true */}
      {canEditPick && (
          <div className="flex space-x-1">
            {["1", "X", "2"].map((option) => (
              <Button
                key={option}
                variant={hasUserPick && userPick.pick === option ? "default" : "outline"}
                size="sm"
                onClick={() => handlePickSelect(option)}
                disabled={submitPickMutation.isPending}
                className="flex-1 text-xs"
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {/* Display user's pick if they made one and deadline has passed */}
        {hasUserPick && isDeadlinePassed && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Hai scelto: {userPick.pick}
            </Badge>
          </div>
        )}

      {/* Current Result Display - show when deadline passed and result exists */}
      {showResult && (
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

      {/* Admin Result Update - show for admins at any time */}
      {user?.isAdmin && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 text-center mb-3">
            {match.result ? "Modifica il risultato:" : "Inserisci il risultato finale:"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className={`py-2 px-4 font-semibold ${
                match.result === "1"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              }`}
              onClick={() => handleResultUpdate("1")}
              disabled={updateResultMutation.isPending}
              data-testid={`result-1-${match.id}`}
            >
              <div className="text-lg">1</div>
            </Button>

            <Button
              variant="outline"
              className={`py-2 px-4 font-semibold ${
                match.result === "X"
                  ? "bg-gray-600 text-white border-gray-600"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
              }`}
              onClick={() => handleResultUpdate("X")}
              disabled={updateResultMutation.isPending}
              data-testid={`result-x-${match.id}`}
            >
              <div className="text-lg">X</div>
            </Button>

            <Button
              variant="outline"
              className={`py-2 px-4 font-semibold ${
                match.result === "2"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              }`}
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

  return isDeadlinePassed ? (
    <Link href={`/matches/${match.id}`} passHref>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}