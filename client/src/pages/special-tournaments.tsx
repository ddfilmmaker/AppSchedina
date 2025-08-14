
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SpecialTournaments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaguesData, isLoading } = useQuery({
    queryKey: ["/api/leagues"],
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const leagues = Array.isArray(leaguesData) ? leaguesData : (leaguesData || []);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tornei Speciali</h1>
      </div>

      <div className="space-y-4">
        {leagues.length > 0 ? (
          leagues.map((league: any) => (
            <Link key={league.id} href={`/league/${league.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{league.name}</h4>
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      Tornei Speciali
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Visualizza i tornei speciali di questa lega
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Codice: {league.code}
                    </span>
                    <span className="text-primary text-sm font-medium">
                      Vai alla lega →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Devi essere membro di una lega per accedere ai tornei speciali</p>
              <div className="space-y-2">
                <Link href="/create-league">
                  <Button className="w-full">
                    Crea una nuova lega
                  </Button>
                </Link>
                <Link href="/join-league">
                  <Button variant="outline" className="w-full">
                    Unisciti a una lega
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
