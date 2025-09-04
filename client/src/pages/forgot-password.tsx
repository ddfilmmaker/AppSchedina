
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Errore",
        description: "Inserisci la tua email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        throw new Error("Errore nell'invio");
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 totocalcio-gradient rounded-full p-1">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                  <img 
                    src={logoImage} 
                    alt="Soccer Ball Logo" 
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      console.error('Logo failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold retro-title mb-2 text-primary">
            Password Dimenticata
          </h1>
          <div className="w-12 h-1 retro-green-gradient rounded-full mx-auto mt-2"></div>
        </div>

        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-xl font-bold text-center text-primary">
              {emailSent ? "Email Inviata!" : "Reimposta Password"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {emailSent 
                ? "Controlla la tua email per il link di reset" 
                : "Inserisci la tua email per ricevere il link di reset"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {emailSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Se l'email esiste nel nostro sistema, riceverai un link per reimpostare la password entro pochi minuti.
                </p>
                <Link href="/auth">
                  <Button className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold">
                    Torna al Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-primary">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="La tua email"
                    className="retro-input rounded-xl h-12 text-base border-0"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full retro-green-gradient retro-button rounded-xl h-14 text-base font-bold text-white border-0"
                  disabled={isLoading}
                >
                  {isLoading ? "Invio in corso..." : "Invia Link di Reset"}
                </Button>
              </form>
            )}

            <div className="flex justify-center">
              <Link href="/auth">
                <Button variant="ghost" className="text-primary font-medium">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna al Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
