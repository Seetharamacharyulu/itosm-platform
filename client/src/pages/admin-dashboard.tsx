import { useState } from "react";
import { StatsCards } from "@/components/stats-cards";
import { TicketTable } from "@/components/ticket-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ticketsApi, statsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw } from "lucide-react";

export default function AdminDashboardPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tickets = [], isLoading: ticketsLoading, refetch } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: () => ticketsApi.getAll(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => statsApi.get(),
  });

  // Filter tickets based on current filters
  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = statusFilter === "all" || ticket.status?.toLowerCase() === statusFilter.toLowerCase();
    const typeMatch = typeFilter === "all" || ticket.requestType === typeFilter;
    const searchMatch = searchQuery === "" || 
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.requestType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-foreground mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage all IT service requests and system operations</p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : stats ? (
          <StatsCards stats={stats} isAdmin={true} />
        ) : null}

        {/* Filters and Actions */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Software Installation">Software Installation</SelectItem>
                    <SelectItem value="Hardware Replacement">Hardware Replacement</SelectItem>
                    <SelectItem value="License Activation">License Activation</SelectItem>
                    <SelectItem value="Network Issue">Network Issue</SelectItem>
                    <SelectItem value="System Maintenance">System Maintenance</SelectItem>
                    <SelectItem value="User Access">User Access</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  data-testid="input-search-tickets"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="outline" data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleRefresh} data-testid="button-refresh">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Tickets Table */}
        {ticketsLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <TicketTable 
            tickets={filteredTickets} 
            title="All Tickets" 
            isAdmin={true}
          />
        )}
      </div>
    </div>
  );
}
