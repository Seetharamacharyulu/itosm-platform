import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { setCurrentUser } from "@/lib/auth";
import { useLocation } from "wouter";
import { AlertCircle, User, Shield } from "lucide-react";
import geosoftLogo from "@assets/Horizontal@4x-8_1758525197447.png";

const loginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  username: z.string().min(1, "Username is required"),
});

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [loginType, setLoginType] = useState<"user" | "admin">("user");

  const userForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      username: "",
    },
  });

  const adminForm = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const userLoginMutation = useMutation({
    mutationFn: authApi.validate,
    onSuccess: (user) => {
      setCurrentUser(user);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Invalid credentials. Please try again.");
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: authApi.validateAdmin,
    onSuccess: (user) => {
      setCurrentUser(user);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Invalid admin credentials. Please try again.");
    },
  });

  const onUserSubmit = (data: LoginFormData) => {
    setError("");
    userLoginMutation.mutate(data);
  };

  const onAdminSubmit = (data: AdminLoginFormData) => {
    setError("");
    adminLoginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex justify-center">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-xl shadow-lg">
                <img 
                  src={geosoftLogo} 
                  alt="GeoSoft Logo" 
                  className="h-12 w-auto filter brightness-0 invert"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-medium text-foreground">ITOSM Platform</h1>
            <p className="text-muted-foreground mt-1">Geosoft Global-surtech service portal</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={loginType} onValueChange={(value) => setLoginType(value as "user" | "admin")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="user" className="flex items-center space-x-2" data-testid="tab-user-login">
                <User className="h-4 w-4" />
                <span>User Login</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center space-x-2" data-testid="tab-admin-login">
                <Shield className="h-4 w-4" />
                <span>Admin Login</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                  <FormField
                    control={userForm.control}
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
                    control={userForm.control}
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
                    disabled={userLoginMutation.isPending}
                    data-testid="button-user-sign-in"
                  >
                    {userLoginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="admin">
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                  <FormField
                    control={adminForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Username</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="e.g., admin.user"
                            className="h-12"
                            data-testid="input-admin-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="h-12"
                            data-testid="input-admin-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium"
                    disabled={adminLoginMutation.isPending}
                    data-testid="button-admin-sign-in"
                  >
                    {adminLoginMutation.isPending ? "Signing In..." : "Admin Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1">
              {loginType === "user" ? (
                <p>Employee ID: EMP123 | Username: john.doe</p>
              ) : (
                <p>Username: admin.user | Password: admin123</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
