import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { isLoggedIn, isAdmin } from "@/lib/auth";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import NewTicketPage from "@/pages/new-ticket";
import AdminDashboardPage from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function MainApp() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Set active tab based on current location
    if (location === "/dashboard") setActiveTab("dashboard");
    else if (location === "/new-ticket") setActiveTab("new-ticket");
    else if (location === "/admin") setActiveTab("admin");
  }, [location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "dashboard":
        setLocation("/dashboard");
        break;
      case "new-ticket":
        setLocation("/new-ticket");
        break;
      case "admin":
        setLocation("/admin");
        break;
    }
  };

  if (!isLoggedIn()) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/new-ticket" component={NewTicketPage} />
        {isAdmin() && <Route path="/admin" component={AdminDashboardPage} />}
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={() => {
          setLocation("/dashboard");
          return null;
        }} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
