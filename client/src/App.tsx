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
import Matchday from "@/pages/matchday";
import Leaderboard from "@/pages/leaderboard";
import CreateLeague from "@/pages/create-league";
import JoinLeague from "@/pages/join-league";
import SpecialTournaments from "@/pages/special-tournaments";
import NotFound from "@/pages/not-found";

import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";

function AppContent() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false
  });

  useEffect(() => {
    // If user is null (401 error) and we're not on the auth page, redirect
    if (!isLoading && user === null && window.location.pathname !== "/auth") {
      window.location.href = "/auth";
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={Auth} />
        <Route component={Auth} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1 pb-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/leagues/:id" component={League} />
          <Route path="/matchdays/:id" component={Matchday} />
          <Route path="/leagues/:id/leaderboard" component={Leaderboard} />
          <Route path="/create-league" component={CreateLeague} />
          <Route path="/join-league" component={JoinLeague} />
          <Route path="/special-tournaments" component={SpecialTournaments} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
    </div>
  );
}

function AppContent() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-accent font-bold text-sm">S</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user.user} />
      
      <main className="pb-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/league/:id" component={League} />
          <Route path="/matchday/:id" component={Matchday} />
          <Route path="/leaderboard/:leagueId" component={Leaderboard} />
          <Route path="/create-league" component={CreateLeague} />
          <Route path="/join-league" component={JoinLeague} />
          <Route path="/special-tournaments" component={SpecialTournaments} />
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
