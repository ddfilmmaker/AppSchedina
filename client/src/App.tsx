import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import Home from "@/pages/home";
import Auth from "@/pages/auth";
import League from "@/pages/league";
import Leagues from "@/pages/leagues";
import Matchday from "@/pages/matchday";
import Match from "@/pages/match";
import Matchdays from "@/pages/matchdays";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";
import CreateLeague from "@/pages/create-league";
import JoinLeague from "@/pages/join-league";
import CreateMatchday from "@/pages/create-matchday";
import SpecialTournaments from "@/pages/special-tournaments";
import LeagueSpecialTournaments from "./pages/league-special-tournaments";
import PreSeasonPredictions from "./pages/pre-season-predictions";
import NotFound from "@/pages/not-found";

import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";

function AppContent() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    // If user is null (401 error) and we're not on the auth page, redirect
    if (!isLoading && authData === null) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/auth") {
        console.log("User not authenticated, redirecting to auth");
        window.location.href = "/auth";
      }
    }
  }, [authData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, always show Auth page regardless of route
  if (!authData) {
    // Make sure the URL shows /auth
    if (window.location.pathname !== "/auth") {
      window.history.replaceState(null, "", "/auth");
    }
    return <Auth />;
  }

  // Extract user from auth data (API returns { user: { id, nickname, isAdmin } })
  const user = (authData as any)?.user || authData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="pb-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/leagues" component={Leagues} />
          <Route path="/matchdays" component={Matchdays} />
          <Route path="/profile" component={Profile} />
          <Route path="/league/:id" component={League} />
          <Route path="/matchday/:id" component={Matchday} />
          <Route path="/match/:id" component={Match} />
          <Route path="/leaderboard/:leagueId" component={Leaderboard} />
          <Route path="/create-league" component={CreateLeague} />
          <Route path="/join-league" component={JoinLeague} />
          <Route path="/special-tournaments" component={SpecialTournaments} />
          <Route
            path="/leagues/:leagueId/special-tournaments"
            component={LeagueSpecialTournaments}
          />
          <Route
            path="/leagues/:leagueId/pre-season-predictions"
            component={PreSeasonPredictions}
          />
          <Route
            path="/league/:leagueId/create-matchday"
            component={CreateMatchday}
          />
          <Route
            path="/leagues/:leagueId/supercoppa-predictions"
            component={SupercoppaPredictions}
          />
          <Route component={NotFound} />
        </Switch>
      </main>

      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;