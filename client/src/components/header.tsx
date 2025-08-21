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
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center relative shadow-md border border-gray-800">
            {/* Mini soccer ball */}
            <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="48" fill="white" stroke="#000" strokeWidth="3"/>
              <path d="M50 20 L65 32 L59 52 L41 52 L35 32 Z" fill="#000"/>
              <path d="M50 20 L35 32 L25 28 L30 12 L45 12 Z" fill="white" stroke="#000" strokeWidth="2"/>
              <path d="M50 20 L65 32 L75 28 L70 12 L55 12 Z" fill="white" stroke="#000" strokeWidth="2"/>
              <path d="M35 32 L41 52 L26 66 L12 58 L18 42 L25 28 Z" fill="white" stroke="#000" strokeWidth="2"/>
              <path d="M65 32 L75 28 L82 42 L88 58 L74 66 L59 52 Z" fill="white" stroke="#000" strokeWidth="2"/>
              <path d="M41 52 L59 52 L50 80 L35 68 Z" fill="white" stroke="#000" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="text-white font-bold text-lg">La Schedina</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={handleNotifications}
            data-testid="button-notifications"
          >
            <Bell className="w-6 h-6" />
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