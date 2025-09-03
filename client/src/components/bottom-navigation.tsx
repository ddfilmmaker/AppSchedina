import { useLocation } from "wouter";
import { Home, Users, User } from "lucide-react";
import { Link } from "wouter";

export default function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 min-h-[4rem]" data-testid="bottom-navigation">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-1">
          <Link href="/">
            <button 
              className={`flex flex-col items-center py-2 px-1 ${
                isActive("/") ? "text-primary" : "text-gray-400"
              }`}
              data-testid="nav-home"
            >
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </button>
          </Link>
          
          <Link href="/leagues">
            <button 
              className={`flex flex-col items-center py-2 px-1 ${
                isActive("/leagues") ? "text-primary" : "text-gray-400"
              }`}
              data-testid="nav-leagues"
            >
              <Users className="w-6 h-6 mb-1" />
              <span className="text-xs">Leghe</span>
            </button>
          </Link>
          
          <Link href="/profile">
            <button 
              className={`flex flex-col items-center py-2 px-1 ${
                isActive("/profile") ? "text-primary" : "text-gray-400"
              }`}
              data-testid="nav-profile"
            >
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs">Profilo</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
