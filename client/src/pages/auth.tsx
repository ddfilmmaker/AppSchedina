import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, register } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/logo.png";

export default function Auth() {
  const [loginData, setLoginData] = useState({ nickname: "", password: "" });
  const [registerData, setRegisterData] = useState({ nickname: "", email: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false); // State to manage email verification message
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: () => login(loginData.nickname, loginData.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Redirect to home page after successful login
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => register(registerData.nickname, registerData.email, registerData.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Set state to show email verification message
      setEmailVerificationSent(true);
      // Redirect to home page after short delay to let state update
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Errore di registrazione",
        description: error.message || "Errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header with modern soccer ball logo */}
        <div className="text-center mb-10">
          <div className="relative mx-auto mb-6">
            <div className="w-28 h-28 mx-auto relative">
              <div className="absolute inset-0 totocalcio-gradient rounded-full p-1">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                  {/* Custom soccer ball logo */}
                  <img 
                    src={logoImage} 
                    alt="Soccer Ball Logo" 
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      console.error('Logo failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          <h1 className="text-5xl font-bold retro-title mb-2 bg-gradient-to-r from-primary via-success to-accent bg-clip-text text-transparent">
            La Schedina
          </h1>
          <p className="text-lg text-muted-foreground font-medium">Totocalcio con gli amici</p>
          <div className="w-16 h-1 retro-green-gradient rounded-full mx-auto mt-3"></div>
        </div>

        {/* Modern tabs with retro colors */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-3 rounded-2xl p-1 mb-6 border-0 bg-transparent">
            <TabsTrigger 
              value="login" 
              data-testid="tab-login"
              className="rounded-xl font-semibold text-sm py-3 retro-green-gradient text-white shadow-lg transition-all duration-300"
            >
              Accedi
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              data-testid="tab-register"
              className="rounded-xl font-semibold text-sm py-3 retro-red-gradient text-white shadow-lg transition-all duration-300"
            >
              Registrati
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <Card className="retro-card border-0 rounded-3xl overflow-hidden">
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-center text-primary">Bentornato!</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Accedi per continuare a giocare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-3">
                  <Label htmlFor="login-nickname" className="text-sm font-semibold text-primary">
                    Nickname
                  </Label>
                  <Input
                    id="login-nickname"
                    type="text"
                    value={loginData.nickname}
                    onChange={(e) => setLoginData({ ...loginData, nickname: e.target.value })}
                    placeholder="Il tuo nickname"
                    data-testid="input-login-nickname"
                    className="retro-input rounded-xl h-12 text-base border-0"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="login-password" className="text-sm font-semibold text-primary">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="La tua password"
                      data-testid="input-login-password"
                      className="retro-input rounded-xl h-12 text-base border-0 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 rounded-lg hover:bg-primary/10 text-primary"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full retro-green-gradient retro-button rounded-xl h-14 text-base font-bold text-white border-0 mt-8"
                  onClick={() => loginMutation.mutate()}
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Accesso..." : "Accedi"}
                </Button>
                <div className="text-center mt-4">
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-secondary font-medium transition-colors">
                    Password dimenticata?
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <Card className="retro-card border-0 rounded-3xl overflow-hidden">
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-center text-secondary">Iniziamo!</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Crea il tuo account per giocare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                {emailVerificationSent ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Clicca sul link nell'email per verificare il tuo account e completare la registrazione.
                    </p>
                    <Button
                      className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold"
                      onClick={() => window.location.href = "/"}
                    >
                      Continua
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="register-nickname" className="text-sm font-semibold text-secondary">
                        Nickname
                      </Label>
                      <Input
                        id="register-nickname"
                        type="text"
                        value={registerData.nickname}
                        onChange={(e) => setRegisterData({ ...registerData, nickname: e.target.value })}
                        placeholder="Scegli un nickname"
                        data-testid="input-register-nickname"
                        className="retro-input rounded-xl h-12 text-base border-0"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-email" className="text-sm font-semibold text-secondary">
                        Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="La tua email"
                        data-testid="input-register-email"
                        className="retro-input rounded-xl h-12 text-base border-0"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-sm font-semibold text-secondary">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          placeholder="Scegli una password"
                          data-testid="input-register-password"
                          className="retro-input rounded-xl h-12 text-base border-0 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-10 w-10 rounded-lg hover:bg-secondary/10 text-secondary"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full retro-red-gradient retro-button rounded-xl h-14 text-base font-bold text-white border-0 mt-8"
                      onClick={() => registerMutation.mutate()}
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Registrazione..." : "Registrati"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}