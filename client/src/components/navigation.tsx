import { Button } from "@/components/ui/button";
import { getCurrentUser, clearCurrentUser, isAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { Ticket, Settings, Plus, BarChart3, LogOut } from "lucide-react";

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
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Ticket className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-medium text-foreground">ITOSM Platform</h1>
          </div>
          
          <nav className="flex items-center space-x-6">
            <button 
              className={getTabClasses("dashboard")}
              onClick={() => onTabChange("dashboard")}
              data-testid="nav-dashboard"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            
            <button 
              className={getTabClasses("new-ticket")}
              onClick={() => onTabChange("new-ticket")}
              data-testid="nav-new-ticket"
            >
              <Plus className="h-4 w-4" />
              <span>New Ticket</span>
            </button>
            
            {isAdmin() && (
              <button 
                className={getTabClasses("admin")}
                onClick={() => onTabChange("admin")}
                data-testid="nav-admin"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
            
            <div className="flex items-center space-x-3 pl-6 border-l border-border">
              <span className="text-sm text-muted-foreground" data-testid="user-display">
                {user?.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
