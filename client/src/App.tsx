import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
import PreSeasonPredictions from "./pages/pre-season-predictions";
import SupercoppaPredictions from "./pages/supercoppa-predictions";
import CoppaItaliaPredictions from "./pages/coppa-italia-predictions"; // Import the new page
import NotFound from "@/pages/not-found";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";

import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";

function AppContent() {
  const { toast } = useToast();
  const { data: authData, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Refetch auth data when verification is successful
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === '1') {
      // Refetch auth data to update verification status
      refetch();
    }
  }, [refetch]);

  // Ensure leagues are refetched when auth data changes
  useEffect(() => {
    if (authData && 'user' in authData && authData.user) {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      queryClient.refetchQueries({ queryKey: ["/api/leagues"] });
    }
  }, [authData]);

  useEffect(() => {
    // If user is null (401 error) and we're not on auth-related pages, redirect
    if (!isLoading && authData === null) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/auth") && currentPath !== "/verify-email") {
        console.log("User not authenticated, redirecting to auth");
        window.location.href = "/auth";
      }
    }
    // If user is authenticated and we're on the auth page, redirect to home
    if (!isLoading && authData && window.location.pathname === "/auth") {
      console.log("User authenticated, redirecting to home");
      window.location.href = "/";
    }
  }, [authData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, allow auth-related pages but redirect others to auth
  if (!authData) {
    const currentPath = window.location.pathname;

    if (!currentPath.startsWith("/auth") && currentPath !== "/verify-email") {
      window.history.replaceState(null, "", "/auth");
      return <Auth />;
    }

    // Show the appropriate auth-related component
    if (currentPath === "/auth/forgot-password") {
      return <ForgotPassword />;
    }
    if (currentPath === "/auth/reset-password") {
      return <ResetPassword />;
    }
    if (currentPath === "/verify-email") {
      return <VerifyEmail />;
    }

    return <Auth />;
  }

  // Show loading during auth transitions to prevent 404 flash
  if (window.location.pathname === "/auth") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, redirect away from auth pages
  if (authData) {
    const currentPath = window.location.pathname;

    if (currentPath.startsWith("/auth")) {
      // Immediate redirect without showing loading state to prevent flash
      window.location.replace("/");
      return null;
    }
  }

  // Extract user from auth data (API returns { user: { id, nickname, isAdmin } })
  const user = (authData as any)?.user || authData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="pb-24">
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
          <Route
            path="/league/:leagueId/create-matchday"
            component={CreateMatchday}
          />
          <Route
            path="/leagues/:leagueId/pre-season-predictions"
            component={PreSeasonPredictions}
          />
          <Route path="/leagues/:leagueId/supercoppa-predictions" component={SupercoppaPredictions} />
          <Route path="/leagues/:leagueId/coppa-italia-predictions" component={CoppaItaliaPredictions} />
          <Route path="/auth" component={Auth} />
          <Route path="/auth/forgot-password" component={ForgotPassword} />
          <Route path="/auth/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
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