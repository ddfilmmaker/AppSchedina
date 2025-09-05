
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    console.log('Verification page loaded with token:', token);

    if (!token) {
      setStatus('error');
      setMessage('Token di verifica mancante');
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        console.log('Sending verification request for token:', token);
        const response = await fetch(`/auth/verify?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        console.log('Verification response:', { status: response.status, data });

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verificata con successo!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Errore nella verifica');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Errore di connessione');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen paper-texture flex items-center justify-center px-4 py-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 totocalcio-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 retro-red-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 retro-green-gradient rounded-full opacity-10 blur-2xl"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <Card className="retro-card border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8 text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="w-16 h-16 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {status === 'loading' && 'Verifica in corso...'}
              {status === 'success' && 'Email Verificata!'}
              {status === 'error' && 'Errore di Verifica'}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Ora puoi accedere al tuo account normalmente.
                </p>
                <Link href="/auth">
                  <Button className="w-full retro-green-gradient retro-button rounded-xl h-12 text-white border-0 font-bold">
                    Vai al Login
                  </Button>
                </Link>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Contatta il supporto se il problema persiste.
                </p>
                <Link href="/auth">
                  <Button className="w-full retro-red-gradient retro-button rounded-xl h-12 text-white border-0 font-bold">
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
