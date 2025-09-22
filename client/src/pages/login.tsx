import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { setCurrentUser } from "@/lib/auth";
import { useLocation } from "wouter";
import { Ticket, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  username: z.string().min(1, "Username is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      username: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.validate,
    onSuccess: (user) => {
      setCurrentUser(user);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Invalid credentials. Please try again.");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Ticket className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-medium text-foreground">ITOSM Platform</h1>
            <p className="text-muted-foreground mt-1">IT Operations & Service Management</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="e.g., EMP123"
                        className="h-12"
                        data-testid="input-employee-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="e.g., john.doe"
                        className="h-12"
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 font-medium"
                disabled={loginMutation.isPending}
                data-testid="button-sign-in"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1">
              <p>Employee ID: EMP123 | Username: john.doe (User)</p>
              <p>Employee ID: ADMIN01 | Username: admin.user (Admin)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
