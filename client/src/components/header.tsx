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
    <header className="bg-primary shadow-lg sticky top-0 z-50" data-testid="header">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center relative shadow-md border-2 border-yellow-600" style={{
            background: 'radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b)',
          }}>
            {/* Mini football pattern */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 32 32">
              <path
                d="M8 6 Q16 10 24 6"
                stroke="#92400e"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M6 10 Q10 16 6 22"
                stroke="#92400e"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M26 10 Q22 16 26 22"
                stroke="#92400e"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M8 26 Q16 22 24 26"
                stroke="#92400e"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            {/* Mini 1-X-2 text */}
            <div className="relative z-10 text-yellow-900 font-black text-xs leading-none">
              <div className="text-center">1X2</div>
            </div>
          </div>
          <h1 className="text-white font-bold text-lg">La Schedina</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white relative"
            onClick={handleNotifications}
            data-testid="button-notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white font-medium text-sm"
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