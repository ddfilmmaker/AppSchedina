import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { joinLeague } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function JoinLeague() {
  const [code, setCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinLeagueMutation = useMutation({
    mutationFn: () => joinLeague(code),
    onSuccess: (result) => {
      toast({
        title: "Iscrizione completata",
        description: `Ti sei unito alla lega "${result.league.name}"!`,
      });
      // Invalidate both leagues list and the specific league data
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", result.league.id] });
      setLocation(`/league/${result.league.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Codice lega non valido",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: "Errore",
        description: "Il codice della lega è obbligatorio",
        variant: "destructive",
      });
      return;
    }
    joinLeagueMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Unisciti a una Lega</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Codice di Invito</CardTitle>
          <CardDescription>
            Inserisci il codice ricevuto dall'amministratore della lega
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="league-code">Codice Lega</Label>
              <Input
                id="league-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="es. ABC123"
                className="uppercase"
                data-testid="input-league-code"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-green-700"
              disabled={joinLeagueMutation.isPending}
              data-testid="button-join-league"
            >
              {joinLeagueMutation.isPending ? "Iscrizione..." : "Unisciti alla Lega"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">Non hai un codice?</h3>
        <p className="text-sm text-green-800 mb-3">
          Chiedi all'amministratore della lega di condividere il codice di invito.
        </p>
        <Link href="/create-league">
          <Button variant="outline" size="sm" className="border-green-300 text-green-700">
            Oppure crea una nuova lega
          </Button>
        </Link>
      </div>
    </div>
  );
}
