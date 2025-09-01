
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createLeague } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CreateLeague() {
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({ 
    queryKey: ["/api/auth/me"],
    retry: false
  });
  
  const user = (authData as any)?.user;

  // Redirect to auth if not logged in
  if (authData && !user) {
    setLocation("/auth");
    return null;
  }

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

  // Show loading while checking authentication
  if (!authData) {
    return (
      <div className="min-h-screen bg-gray-50 paper-texture">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 paper-texture">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Crea Nuova Lega</h1>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Dettagli Lega</h2>
            <p className="text-sm text-gray-600">
              Scegli un nome per la tua lega. Riceverai un codice per invitare gli amici.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="league-name" className="text-sm font-medium text-gray-700">
                Nome della Lega
              </Label>
              <Input
                id="league-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Amici del Bar"
                className="w-full"
                data-testid="input-league-name"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={createLeagueMutation.isPending}
              data-testid="button-create-league"
            >
              {createLeagueMutation.isPending ? "Creazione..." : "Crea Lega"}
            </Button>
          </form>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Come funziona?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sarai automaticamente l'amministratore della lega</li>
            <li>• Riceverai un codice per invitare gli amici</li>
            <li>• Potrai creare giornate e inserire i risultati</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
