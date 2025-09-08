
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import logoImage from "@assets/logo.png";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token di reset mancante");
        setTokenValidating(false);
        return;
      }

      try {
        // Just validate that we have a token, the actual validation happens on submit
        setTokenValid(true);
        setTokenValidating(false);
      } catch (error) {
        setError("Token non valido o scaduto");
        setTokenValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token: token,
          newPassword: newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordResetSuccess(true);
        toast({
          title: "Successo",
          description: "Password reimpostata con successo!",
        });
      } else {
        throw new Error(data.error || "Errore durante il reset della password");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Errore durante il reset della password");
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il reset della password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (tokenValidating) {
      return (
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Validazione token in corso...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center space-y-4">
          <XCircle className="w-16 h-16 text-red-600 mx-auto" />
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/auth/forgot-password">
            <Button className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold">
              Richiedi Nuovo Link
            </Button>
          </Link>
        </div>
      );
    }

    if (passwordResetSuccess) {
      return (
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Password reimpostata con successo! Ora puoi accedere con la nuova password.
          </p>
          <Link href="/auth">
            <Button className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold">
              Vai al Login
            </Button>
          </Link>
        </div>
      );
    }

    if (tokenValid) {
      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="newPassword" className="text-sm font-semibold text-primary">
              Nuova Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci la nuova password"
                className="retro-input rounded-xl h-12 text-base border-0 pr-12"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-10 w-10 rounded-lg hover:bg-primary/10 text-primary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimo 6 caratteri
            </p>
          </div>
          <Button
            type="submit"
            className="w-full retro-green-gradient retro-button rounded-xl h-14 text-base font-bold text-white border-0"
            disabled={isLoading}
          >
            {isLoading ? "Reimpostazione..." : "Reimposta Password"}
          </Button>
        </form>
      );
    }

    return null;
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 totocalcio-gradient rounded-full p-1">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                  <img 
                    src={logoImage} 
                    alt="Soccer Ball Logo" 
                    className="w-14 h-14 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold retro-title mb-2 text-primary">
            Reimposta Password
          </h1>
          <div className="w-12 h-1 retro-green-gradient rounded-full mx-auto mt-2"></div>
        </div>

        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-xl font-bold text-center text-primary">
              {passwordResetSuccess ? "Successo!" : 
               error ? "Errore" : 
               tokenValid ? "Imposta Nuova Password" : "Validazione Token"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {passwordResetSuccess ? "Password reimpostata correttamente" : 
               error ? "Si è verificato un problema" : 
               tokenValid ? "Scegli una password sicura" : "Controllo del token in corso"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {renderContent()}

            {!passwordResetSuccess && (
              <div className="flex justify-center mt-6">
                <Link href="/auth">
                  <Button variant="ghost" className="text-primary font-medium">
                    Torna al Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
