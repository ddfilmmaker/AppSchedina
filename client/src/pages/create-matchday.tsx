import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { createMatchday } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function CreateMatchday() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
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

  useState(() => {
    if (!deadline) {
      setDeadline(getDefaultDeadline());
    }
  });

  const createMatchdayMutation = useMutation({
    mutationFn: () => {
      if (!leagueId) throw new Error("League ID not found");
      return createMatchday(leagueId, name, new Date(deadline));
    },
    onSuccess: (matchday) => {
      toast({
        title: "Giornata creata",
        description: `La giornata "${matchday.name}" è stata creata con successo!`,
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
    createMatchdayMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href={`/league/${leagueId}`}>
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Crea Nuova Giornata</h1>
      </div>

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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-xs text-gray-500">
                I partecipanti potranno modificare i pronostici fino a questa data e ora.
              </p>
            </div>

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
        </CardContent>
      </Card>
    </div>
  );
}