import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Pagina Non Trovata</h1>
            <p className="text-sm text-gray-600 mb-6">
              La pagina che stai cercando non esiste.
            </p>
            <Link href="/">
              <Button className="bg-primary text-white hover:bg-primary/90">
                Torna alla Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
