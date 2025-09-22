import { Navigation } from "@/components/navigation";
import { StatsCards } from "@/components/stats-cards";
import { TicketTable } from "@/components/ticket-table";
import { useQuery } from "@tanstack/react-query";
import { ticketsApi, statsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const user = getCurrentUser();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets", user?.id],
    queryFn: () => user ? ticketsApi.getByUserId(user.id) : [],
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats", user?.id],
    queryFn: () => user ? statsApi.get(user.id) : null,
    enabled: !!user,
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-foreground mb-2">My Tickets</h2>
          <p className="text-muted-foreground">Track and manage your IT service requests</p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : stats ? (
          <StatsCards stats={stats} />
        ) : null}

        {/* Tickets Table */}
        {ticketsLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <TicketTable 
            tickets={tickets} 
            title="Recent Tickets" 
            isAdmin={false}
          />
        )}
      </div>
    </div>
  );
}
