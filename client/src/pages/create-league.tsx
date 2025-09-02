
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
      <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-sm relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
              <div className="h-20 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-3 text-primary hover:bg-primary/10 rounded-xl" 
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary retro-title">Crea Nuova Lega</h1>
        </div>

        {/* Main Form Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-center text-primary retro-title">
              Dettagli Lega
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground font-medium">
              Scegli un nome per la tua lega. Riceverai un codice per invitare gli amici.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="league-name" className="text-sm font-semibold text-primary">
                  Nome della Lega
                </Label>
                <Input
                  id="league-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Amici del Bar"
                  className="retro-input rounded-xl h-12 text-base border-0"
                  data-testid="input-league-name"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full retro-green-gradient retro-button rounded-xl h-14 text-base font-bold text-white border-0 mt-8"
                disabled={createLeagueMutation.isPending}
                data-testid="button-create-league"
              >
                {createLeagueMutation.isPending ? "Creazione..." : "Crea Lega"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <h3 className="font-bold text-primary retro-title mb-3">Come funziona?</h3>
            <ul className="text-sm text-primary/70 space-y-2 font-medium">
              <li className="flex items-start">
                <span className="text-accent mr-2 font-bold">•</span>
                Sarai automaticamente l'amministratore della lega
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2 font-bold">•</span>
                Riceverai un codice per invitare gli amici
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2 font-bold">•</span>
                Potrai creare giornate e inserire i risultati
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
