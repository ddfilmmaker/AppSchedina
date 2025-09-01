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
            {/* Soccer ball logo */}
            <img 
              src="/logo.png" 
              alt="Soccer Ball Logo" 
              className="w-7 h-7 object-contain rounded-full"
            />
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