import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsApi, softwareApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Send, AlertCircle, CheckCircle, Clock, Users, Zap } from "lucide-react";

const ticketSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  softwareId: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onSuccess?: () => void;
}

export function TicketForm({ onSuccess }: TicketFormProps) {
  const [showSoftware, setShowSoftware] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getCurrentUser();

  const { data: software = [] } = useQuery({
    queryKey: ["/api/software"],
    queryFn: () => softwareApi.getAll(),
  });

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      requestType: "",
      softwareId: "",
      description: "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Ticket Created Successfully",
        description: `Your ticket ${newTicket.ticketId} has been submitted`,
      });
      form.reset();
      setShowSoftware(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    if (!user) return;

    createTicketMutation.mutate({
      userId: user.id,
      requestType: data.requestType,
      softwareId: data.softwareId ? parseInt(data.softwareId) : undefined,
      description: data.description,
    });
  };

  const handleRequestTypeChange = (value: string) => {
    form.setValue("requestType", value);
    setShowSoftware(value === "Software Installation" || value === "License Activation");
    if (!showSoftware) {
      form.setValue("softwareId", "");
    }
  };

  const handleClear = () => {
    form.reset();
    setShowSoftware(false);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Type *</FormLabel>
                    <Select 
                      onValueChange={handleRequestTypeChange} 
                      value={field.value}
                      data-testid="select-request-type"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Software Installation">Software Installation</SelectItem>
                        <SelectItem value="License Activation">License Activation</SelectItem>
                        <SelectItem value="Hardware Replacement">Hardware Replacement</SelectItem>
                        <SelectItem value="Network Issue">Network Issue</SelectItem>
                        <SelectItem value="System Maintenance">System Maintenance</SelectItem>
                        <SelectItem value="User Access">User Access</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showSoftware && (
                <FormField
                  control={form.control}
                  name="softwareId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Software</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} data-testid="select-software">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select software" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {software.map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} {item.version}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      rows={4}
                      placeholder="Please provide detailed information about your request..."
                      className="resize-vertical"
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="bg-accent/30 border-accent">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <Zap className="h-3 w-3" />
                    <span>Your ticket will be assigned a unique ID (INC-YYYY-NNNN format)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>You'll receive email notifications about status updates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>IT support team will review and respond within 24 hours</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>You can track progress in your dashboard</span>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleClear}
                disabled={createTicketMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
