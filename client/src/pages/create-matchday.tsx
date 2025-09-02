import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { createMatchday, createMatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

interface MatchInput {
  homeTeam: string;
  awayTeam: string;
  deadline: string;
}

export default function CreateMatchday() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [name, setName] = useState("");
  const [matches, setMatches] = useState<MatchInput[]>(
    Array.from({ length: 10 }, () => ({
      homeTeam: "",
      awayTeam: "",
      deadline: "",
    }))
  );
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set default deadline to next Sunday at 15:00
  const getDefaultDeadline = () => {
    const now = new Date();
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(15, 0, 0, 0);
    return nextSunday.toISOString().slice(0, 16);
  };

  // Initialize matches with default deadline using useEffect
  React.useEffect(() => {
    const defaultDeadline = getDefaultDeadline();
    setMatches(prev => prev.map(match => ({ ...match, deadline: defaultDeadline })));
  }, []);

  const updateMatch = (index: number, field: keyof MatchInput, value: string) => {
    setMatches(prev => prev.map((match, i) =>
      i === index ? { ...match, [field]: value } : match
    ));
  };

  const addMatch = () => {
    const defaultDeadline = getDefaultDeadline();
    setMatches(prev => [...prev, {
      homeTeam: "",
      awayTeam: "",
      deadline: defaultDeadline
    }]);
  };

  const removeMatch = (index: number) => {
    if (matches.length > 1) {
      setMatches(prev => prev.filter((_, i) => i !== index));
    }
  };

  const createMatchdayMutation = useMutation({
    mutationFn: async () => {
      if (!leagueId) throw new Error("League ID not found");

      // Create the matchday first
      const matchday = await createMatchday(leagueId, name);

      // Then create all the matches
      const validMatches = matches.filter(match =>
        match.homeTeam.trim() && match.awayTeam.trim() && match.deadline
      );

      if (validMatches.length === 0) {
        throw new Error("Devi inserire almeno una partita valida");
      }

      // Create all matches
      await Promise.all(validMatches.map(match =>
        createMatch(
          matchday.id,
          match.homeTeam.trim(),
          match.awayTeam.trim(),
          new Date(match.deadline)
        )
      ));

      return { matchday, matchesCount: validMatches.length };
    },
    onSuccess: ({ matchday, matchesCount }) => {
      toast({
        title: "Giornata creata",
        description: `La giornata "${matchday.name}" è stata creata con ${matchesCount} partite!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      setLocation(`/league/${leagueId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della giornata",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (createMatchdayMutation.isPending) {
      return;
    }
    
    if (!name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della giornata è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    const validMatches = matches.filter(match =>
      match.homeTeam.trim() && match.awayTeam.trim() && match.deadline
    );

    if (validMatches.length === 0) {
      toast({
        title: "Errore",
        description: "Devi inserire almeno una partita valida",
        variant: "destructive",
      });
      return;
    }

    createMatchdayMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-primary retro-title">Crea Nuova Giornata</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Matchday Details */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="flex items-center space-x-2 text-primary retro-title">
              <Calendar className="w-5 h-5" />
              <span>Dettagli Giornata</span>
            </CardTitle>
            <CardDescription className="text-primary/70 font-medium mt-2">
              Crea una nuova giornata di pronostici per la tua lega.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matchday-name" className="text-primary font-medium">Nome della Giornata</Label>
              <Input
                id="matchday-name"
                type="text"
                placeholder="es. Giornata 1, Semifinale..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-matchday-name"
                className="border-0 bg-gray-50 rounded-xl h-12 px-4 font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* Matches */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-primary retro-title">Partite</CardTitle>
                <CardDescription className="text-primary/70 font-medium mt-2">
                  Inserisci le partite per questa giornata (come una schedina Totocalcio)
                </CardDescription>
              </div>
              <Button type="button" onClick={addMatch} variant="outline" size="sm" className="rounded-xl border-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 p-6 border-0 rounded-2xl bg-gray-50/50 shadow-sm">
                  <div className="space-y-2">
                    <Label htmlFor={`home-team-${index}`} className="text-primary font-medium">Squadra Casa</Label>
                    <Input
                      id={`home-team-${index}`}
                      type="text"
                      placeholder="es. Juventus"
                      value={match.homeTeam}
                      onChange={(e) => updateMatch(index, "homeTeam", e.target.value)}
                      className="border-0 bg-white rounded-xl h-12 px-4 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`away-team-${index}`} className="text-primary font-medium">Squadra Trasferta</Label>
                    <Input
                      id={`away-team-${index}`}
                      type="text"
                      placeholder="es. Milan"
                      value={match.awayTeam}
                      onChange={(e) => updateMatch(index, "awayTeam", e.target.value)}
                      className="border-0 bg-white rounded-xl h-12 px-4 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`deadline-${index}`} className="text-primary font-medium">Scadenza Pronostici</Label>
                    <Input
                      id={`deadline-${index}`}
                      type="datetime-local"
                      value={match.deadline}
                      onChange={(e) => updateMatch(index, "deadline", e.target.value)}
                      className="border-0 bg-white rounded-xl h-12 px-4 font-medium"
                    />
                  </div>

                  {matches.length > 1 && (
                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMatch(index)}
                        className="text-red-600 hover:text-red-700 rounded-xl border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="submit"
            className="w-full retro-green-gradient retro-button rounded-xl h-14 text-white border-0 font-bold shadow-lg"
            disabled={createMatchdayMutation.isPending}
            data-testid="button-create-matchday"
          >
            {createMatchdayMutation.isPending ? "Creazione..." : "Crea Giornata"}
          </Button>
          <Link href={`/league/${leagueId}`}>
            <Button type="button" variant="outline" className="w-full rounded-xl h-12 border-primary/20 text-primary font-medium" data-testid="button-cancel">
              Annulla
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}