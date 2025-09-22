import { Button } from "@/components/ui/button";
import { getCurrentUser, clearCurrentUser, isAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { Settings, Plus, BarChart3, LogOut } from "lucide-react";
import geosoftLogo from "@assets/Horizontal@4x-8_1758525197447.png";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [, setLocation] = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    clearCurrentUser();
    setLocation("/login");
  };

  const getTabClasses = (tab: string) => {
    const isActive = activeTab === tab;
    return `px-4 py-2 flex items-center space-x-2 transition-colors ${
      isActive
        ? "text-primary border-b-2 border-primary font-medium"
        : "text-muted-foreground hover:text-foreground"
    }`;
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-3 lg:py-2 min-h-[60px]">
          {/* Logo and Title Section */}
          <div className="flex items-center space-x-3 mb-2 lg:mb-0">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-2 rounded-lg shadow-sm">
              <img 
                src={geosoftLogo} 
                alt="GeoSoft Logo" 
                className="h-6 sm:h-8 w-auto flex-shrink-0 filter brightness-0 invert"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg sm:text-xl font-medium text-foreground leading-tight truncate">ITOSM Platform</h1>
              <span className="text-xs text-muted-foreground hidden sm:block leading-tight">Geosoft Global-surtech service portal</span>
            </div>
          </div>
          
          {/* Navigation Section */}
          <nav className="flex items-center justify-between lg:justify-end space-x-2 sm:space-x-4 lg:space-x-6">
            <div className="flex items-center space-x-1 sm:space-x-4">
              <button 
                className={getTabClasses("dashboard")}
                onClick={() => onTabChange("dashboard")}
                data-testid="nav-dashboard"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              
              <button 
                className={getTabClasses("new-ticket")}
                onClick={() => onTabChange("new-ticket")}
                data-testid="nav-new-ticket"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
              
              {isAdmin() && (
                <button 
                  className={getTabClasses("admin")}
                  onClick={() => onTabChange("admin")}
                  data-testid="nav-admin"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-6 border-l border-border">
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block" data-testid="user-display">
                {user?.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
