
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SupercoppaPredictions() {
  const { leagueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [winner, setWinner] = useState("");
  const [scorer, setScorer] = useState("");

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href={`/leagues/${leagueId}/special-tournaments`}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Supercoppa Italiana</h1>
      </div>

      {/* Winner Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Vincitore Supercoppa</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={winner} onValueChange={setWinner}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona il vincitore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Juventus">Juventus</SelectItem>
              <SelectItem value="AC Milan">AC Milan</SelectItem>
              <SelectItem value="Atalanta">Atalanta</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Scorer Input */}
      <Card>
        <CardHeader>
          <CardTitle>Marcatore</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Nome del marcatore"
            value={scorer}
            onChange={(e) => setScorer(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        disabled={!winner || !scorer}
        className="w-full"
      >
        Salva Pronostico
      </Button>
    </div>
  );
}
