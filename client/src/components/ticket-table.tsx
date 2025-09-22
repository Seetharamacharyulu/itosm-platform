import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, User, Software } from "@/types";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TicketTableProps {
  tickets: Ticket[];
  users?: User[];
  software?: Software[];
  isAdmin?: boolean;
  title: string;
}

export function TicketTable({ tickets, users = [], software = [], isAdmin = false, title }: TicketTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      ticketsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUserInfo = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? { username: user.username, employeeId: user.employeeId } : { username: "Unknown", employeeId: "" };
  };

  const getSoftwareName = (softwareId?: number) => {
    if (!softwareId) return "-";
    const soft = software.find(s => s.id === softwareId);
    return soft ? `${soft.name} ${soft.version || ""}`.trim() : "-";
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: ticketId, status: newStatus });
  };

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ticket ID
                </TableHead>
                {isAdmin && (
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </TableHead>
                )}
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Request Type
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Software
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={isAdmin ? 7 : 6} 
                    className="px-6 py-8 text-center text-muted-foreground"
                    data-testid="empty-tickets-message"
                  >
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => {
                  const userInfo = getUserInfo(ticket.userId);
                  return (
                    <TableRow 
                      key={ticket.id} 
                      className="hover:bg-accent/50 transition-colors"
                      data-testid={`ticket-row-${ticket.ticketId}`}
                    >
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-primary" data-testid={`ticket-id-${ticket.ticketId}`}>
                          {ticket.ticketId}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-secondary-foreground">
                                {userInfo.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{userInfo.username}</div>
                              <div className="text-xs text-muted-foreground">{userInfo.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground">{ticket.requestType}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">{getSoftwareName(ticket.softwareId)}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {isAdmin ? (
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleStatusChange(ticket.id, value)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className={`w-auto border-none px-2 py-1 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(ticket.createdAt), "MMM dd, yyyy HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-primary hover:text-primary/80 p-0"
                          data-testid={`button-view-ticket-${ticket.ticketId}`}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
