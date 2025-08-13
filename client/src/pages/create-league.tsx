import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createLeague } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CreateLeague() {
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLeagueMutation = useMutation({
    mutationFn: () => createLeague(name),
    onSuccess: (league) => {
      toast({
        title: "Lega creata",
        description: `La lega "${league.name}" è stata creata con successo!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      setLocation(`/league/${league.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della lega",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della lega è obbligatorio",
        variant: "destructive",
      });
      return;
    }
    createLeagueMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Crea Nuova Lega</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli Lega</CardTitle>
          <CardDescription>
            Scegli un nome per la tua lega. Riceverai un codice per invitare gli amici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="league-name">Nome della Lega</Label>
              <Input
                id="league-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Amici del Bar"
                data-testid="input-league-name"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-green-700"
              disabled={createLeagueMutation.isPending}
              data-testid="button-create-league"
            >
              {createLeagueMutation.isPending ? "Creazione..." : "Crea Lega"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Come funziona?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Sarai automaticamente l'amministratore della lega</li>
          <li>• Riceverai un codice per invitare gli amici</li>
          <li>• Potrai creare giornate e inserire i risultati</li>
        </ul>
      </div>
    </div>
  );
}
