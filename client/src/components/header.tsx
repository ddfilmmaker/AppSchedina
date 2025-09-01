import { Bell, Menu } from "lucide-react";
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

interface HeaderProps {
  user: {
    id: string;
    nickname: string;
    isAdmin: boolean;
  };
}

export default function Header({ user }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleNotifications = () => {
    // For now, we'll just log to console - you can extend this later
    console.log("Notifications clicked");
    // Future: could open a notifications dropdown or navigate to notifications page
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear all cached data to ensure fresh state
      queryClient.clear();
      // Force a hard redirect to ensure clean state
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state and redirect
      queryClient.clear();
      window.location.href = "/auth";
    }
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
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 transition-all duration-300"
            onClick={handleNotifications}
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
          </Button>

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