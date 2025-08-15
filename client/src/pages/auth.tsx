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
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg border-2 border-gray-300">
            {/* Soccer ball SVG */}
            <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
              {/* White base circle */}
              <circle cx="32" cy="32" r="30" fill="white" stroke="#000" strokeWidth="2"/>
              
              {/* Pentagon in center */}
              <path d="M32 12 L42 22 L38 36 L26 36 L22 22 Z" fill="black"/>
              
              {/* Hexagons around pentagon */}
              <path d="M32 12 L22 22 L14 18 L18 8 L28 8 Z" fill="white" stroke="black" strokeWidth="1"/>
              <path d="M32 12 L42 22 L50 18 L46 8 L36 8 Z" fill="white" stroke="black" strokeWidth="1"/>
              <path d="M22 22 L26 36 L16 44 L8 36 L14 18 Z" fill="white" stroke="black" strokeWidth="1"/>
              <path d="M42 22 L50 18 L56 28 L48 44 L38 36 Z" fill="white" stroke="black" strokeWidth="1"/>
              <path d="M26 36 L38 36 L32 52 L20 48 L16 44 Z" fill="white" stroke="black" strokeWidth="1"/>
              
              {/* Additional curved lines for 3D effect */}
              <path d="M18 8 C24 6 40 6 46 8" stroke="black" strokeWidth="1" fill="none"/>
              <path d="M8 36 C10 42 22 54 32 52" stroke="black" strokeWidth="1" fill="none"/>
              <path d="M56 28 C54 34 42 46 32 52" stroke="black" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <h1 className="text-2xl text-gray-900">La Schedina</h1>
          <p className="text-gray-600 mt-2">Totocalcio con gli amici</p>
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
