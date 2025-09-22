import { Card, CardContent } from "@/components/ui/card";
import { TicketStats } from "@/types";
import { Ticket, Clock, Cog, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats: TicketStats;
  isAdmin?: boolean;
}

export function StatsCards({ stats, isAdmin = false }: StatsCardsProps) {
  const userStats = [
    {
      title: "Total Tickets",
      value: stats.total,
      icon: Ticket,
      color: "blue",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Cog,
      color: "blue",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      color: "green",
    },
  ];

  const adminStats = [
    ...userStats,
    {
      title: "Urgent",
      value: stats.urgent,
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "Avg Resolution",
      value: "2.5d",
      icon: TrendingUp,
      color: "purple",
    },
  ];

  const displayStats = isAdmin ? adminStats : userStats;

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600",
      yellow: "bg-yellow-100 text-yellow-600",
      green: "bg-green-100 text-green-600",
      red: "bg-red-100 text-red-600",
      purple: "bg-purple-100 text-purple-600",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${isAdmin ? '6' : '4'} gap-6 mb-8`}>
      {displayStats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title} className="shadow-sm" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-foreground" data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
