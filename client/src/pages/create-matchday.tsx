
import { useState } from "react";
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
  kickoff: string;
}

export default function CreateMatchday() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [matches, setMatches] = useState<MatchInput[]>(
    Array.from({ length: 10 }, () => ({
      homeTeam: "",
      awayTeam: "",
      kickoff: "",
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

  // Set default kickoff time
  const getDefaultKickoff = () => {
    const now = new Date();
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(15, 0, 0, 0);
    return nextSunday.toISOString().slice(0, 16);
  };

  useState(() => {
    if (!deadline) {
      setDeadline(getDefaultDeadline());
    }
    // Set default kickoff times for all matches
    const defaultKickoff = getDefaultKickoff();
    setMatches(prev => prev.map(match => ({ ...match, kickoff: defaultKickoff })));
  });

  const updateMatch = (index: number, field: keyof MatchInput, value: string) => {
    setMatches(prev => prev.map((match, i) => 
      i === index ? { ...match, [field]: value } : match
    ));
  };

  const addMatch = () => {
    setMatches(prev => [...prev, {
      homeTeam: "",
      awayTeam: "",
      kickoff: getDefaultKickoff(),
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
      const matchday = await createMatchday(leagueId, name, new Date(deadline));
      
      // Then create all the matches
      const validMatches = matches.filter(match => 
        match.homeTeam.trim() && match.awayTeam.trim() && match.kickoff
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
          new Date(match.kickoff)
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
    if (!name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della giornata è obbligatorio",
        variant: "destructive",
      });
      return;
    }
    if (!deadline) {
      toast({
        title: "Errore",
        description: "La scadenza è obbligatoria",
        variant: "destructive",
      });
      return;
    }
    
    const validMatches = matches.filter(match => 
      match.homeTeam.trim() && match.awayTeam.trim() && match.kickoff
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Crea Nuova Giornata</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Matchday Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Dettagli Giornata</span>
            </CardTitle>
            <CardDescription>
              Crea una nuova giornata di pronostici per la tua lega.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matchday-name">Nome della Giornata</Label>
                <Input
                  id="matchday-name"
                  type="text"
                  placeholder="es. Giornata 1, Semifinale..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-matchday-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchday-deadline">Scadenza Pronostici</Label>
                <Input
                  id="matchday-deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  data-testid="input-matchday-deadline"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Partite</CardTitle>
                <CardDescription>
                  Inserisci le partite per questa giornata (come una schedina Totocalcio)
                </CardDescription>
              </div>
              <Button type="button" onClick={addMatch} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Partita
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <Label htmlFor={`home-team-${index}`} className="text-xs text-gray-500">
                        Squadra Casa
                      </Label>
                      <Input
                        id={`home-team-${index}`}
                        type="text"
                        placeholder="es. Juventus"
                        value={match.homeTeam}
                        onChange={(e) => updateMatch(index, 'homeTeam', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`away-team-${index}`} className="text-xs text-gray-500">
                      Squadra Trasferta
                    </Label>
                    <Input
                      id={`away-team-${index}`}
                      type="text"
                      placeholder="es. Milan"
                      value={match.awayTeam}
                      onChange={(e) => updateMatch(index, 'awayTeam', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`kickoff-${index}`} className="text-xs text-gray-500">
                      Data e Ora
                    </Label>
                    <Input
                      id={`kickoff-${index}`}
                      type="datetime-local"
                      value={match.kickoff}
                      onChange={(e) => updateMatch(index, 'kickoff', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-end">
                    {matches.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMatch(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex space-x-2 pt-4">
          <Link href={`/league/${leagueId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full" data-testid="button-cancel">
              Annulla
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={createMatchdayMutation.isPending}
            data-testid="button-create-matchday"
          >
            {createMatchdayMutation.isPending ? "Creazione..." : "Crea Giornata"}
          </Button>
        </div>
      </form>
    </div>
  );
}
