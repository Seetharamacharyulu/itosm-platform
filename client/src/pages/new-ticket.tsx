import { TicketForm } from "@/components/ticket-form";
import { useLocation } from "wouter";

export default function NewTicketPage() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-foreground mb-2">Create New Ticket</h2>
          <p className="text-muted-foreground">Submit a new IT service request</p>
        </div>

        <TicketForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
