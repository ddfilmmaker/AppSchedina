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

export default function Auth() {
  const [loginData, setLoginData] = useState({ nickname: "", password: "" });
  const [registerData, setRegisterData] = useState({ nickname: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
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
    mutationFn: () => register(registerData.nickname, registerData.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Redirect to home page after successful registration
      window.location.href = "/";
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-24 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg border-2 border-amber-800 transform rotate-12" style={{
            background: 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
          }}>
            {/* Classic football stitching pattern */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 96">
              {/* Center seam */}
              <line
                x1="40"
                y1="15"
                x2="40"
                y2="81"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="4,3"
              />
              {/* Cross stitches - more prominent without text */}
              <g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
                <line x1="33" y1="18" x2="47" y2="24" />
                <line x1="47" y1="18" x2="33" y2="24" />
                <line x1="33" y1="28" x2="47" y2="34" />
                <line x1="47" y1="28" x2="33" y2="34" />
                <line x1="33" y1="38" x2="47" y2="44" />
                <line x1="47" y1="38" x2="33" y2="44" />
                <line x1="33" y1="48" x2="47" y2="54" />
                <line x1="47" y1="48" x2="33" y2="54" />
                <line x1="33" y1="58" x2="47" y2="64" />
                <line x1="47" y1="58" x2="33" y2="64" />
                <line x1="33" y1="68" x2="47" y2="74" />
                <line x1="47" y1="68" x2="33" y2="74" />
                <line x1="33" y1="78" x2="47" y2="84" />
                <line x1="47" y1="78" x2="33" y2="84" />
              </g>
              {/* Side curves for classic football shape */}
              <path
                d="M12 25 Q22 48 12 71"
                stroke="#451a03"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M68 25 Q58 48 68 71"
                stroke="#451a03"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Additional texture lines */}
              <path
                d="M25 12 Q40 18 55 12"
                stroke="#451a03"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M25 84 Q40 78 55 84"
                stroke="#451a03"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Press Start 2P', monospace" }}>La Schedina</h1>
          <p className="text-gray-600 mt-2">Gioca con gli amici</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Accedi</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Registrati</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Accedi</CardTitle>
                <CardDescription>
                  Inserisci le tue credenziali per accedere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-nickname">Nickname</Label>
                  <Input
                    id="login-nickname"
                    type="text"
                    value={loginData.nickname}
                    onChange={(e) => setLoginData({ ...loginData, nickname: e.target.value })}
                    placeholder="Il tuo nickname"
                    data-testid="input-login-nickname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="La tua password"
                      data-testid="input-login-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-green-700"
                  onClick={() => loginMutation.mutate()}
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Accesso..." : "Accedi"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Registrati</CardTitle>
                <CardDescription>
                  Crea un nuovo account per iniziare a giocare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nickname">Nickname</Label>
                  <Input
                    id="register-nickname"
                    type="text"
                    value={registerData.nickname}
                    onChange={(e) => setRegisterData({ ...registerData, nickname: e.target.value })}
                    placeholder="Scegli un nickname"
                    data-testid="input-register-nickname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Scegli una password"
                      data-testid="input-register-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-red-700"
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "Registrazione..." : "Registrati"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
