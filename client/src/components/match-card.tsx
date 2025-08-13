import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPick } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Match, Pick } from "@/lib/api";

interface MatchCardProps {
  match: Match;
  userPick?: Pick;
  isLocked: boolean;
}

export default function MatchCard({ match, userPick, isLocked }: MatchCardProps) {
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

  const handlePickSelect = (pick: string) => {
    if (isLocked) return;
    
    setSelectedPick(pick);
    submitPickMutation.mutate(pick);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
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

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={selectedPick === "1" ? "default" : "outline"}
          className={`py-3 px-4 font-semibold transition-all ${
            selectedPick === "1" 
              ? "bg-primary text-white hover:bg-green-700" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => handlePickSelect("1")}
          disabled={isLocked || submitPickMutation.isPending}
          data-testid={`pick-1-${match.id}`}
        >
          <div className="text-lg">1</div>
          <div className="text-xs">{match.homeTeam}</div>
        </Button>
        
        <Button
          variant={selectedPick === "X" ? "default" : "outline"}
          className={`py-3 px-4 font-semibold transition-all ${
            selectedPick === "X" 
              ? "bg-primary text-white hover:bg-green-700" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => handlePickSelect("X")}
          disabled={isLocked || submitPickMutation.isPending}
          data-testid={`pick-X-${match.id}`}
        >
          <div className="text-lg">X</div>
          <div className="text-xs">Pareggio</div>
        </Button>
        
        <Button
          variant={selectedPick === "2" ? "default" : "outline"}
          className={`py-3 px-4 font-semibold transition-all ${
            selectedPick === "2" 
              ? "bg-primary text-white hover:bg-green-700" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => handlePickSelect("2")}
          disabled={isLocked || submitPickMutation.isPending}
          data-testid={`pick-2-${match.id}`}
        >
          <div className="text-lg">2</div>
          <div className="text-xs">{match.awayTeam}</div>
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
    </div>
  );
}
