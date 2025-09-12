import { Menu } from "lucide-react";
import { logout } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import logoImage from "@assets/logo.png";
import { useMutation } from "@tanstack/react-query";

interface HeaderProps {
  user: {
    id: string;
    nickname: string;
    isAdmin: boolean;
  };
}

export default function Header({ user }: HeaderProps) {
  const [, setLocation] = useLocation();

  

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear all cached queries immediately
      queryClient.clear();
      // Remove any cached data
      queryClient.removeQueries();
      // Force redirect to auth page
      window.location.replace("/auth");
    },
  });

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  return (
    <header className="retro-green-gradient shadow-lg sticky top-0 z-50" data-testid="header">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 bg-white rounded-full p-1">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                {/* Custom soccer ball logo */}
                <img
                  src={logoImage}
                  alt="Soccer Ball Logo"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    console.error('Header logo failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
          <h1 className="text-white font-bold text-lg retro-title">La Schedina</h1>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300 px-3 py-2 rounded-xl"
                data-testid="button-user-menu"
              >
                {user.nickname}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}