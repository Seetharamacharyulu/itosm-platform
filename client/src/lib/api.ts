import { apiRequest } from "@/lib/queryClient";
import { LoginCredentials, CreateTicketData, User, Ticket, Software, TicketStats } from "@/types";

export const authApi = {
  validate: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiRequest("POST", "/api/auth/validate", credentials);
    return response.json();
  },
};

export const ticketsApi = {
  create: async (data: CreateTicketData): Promise<Ticket> => {
    const response = await apiRequest("POST", "/api/tickets", data);
    return response.json();
  },
  
  getAll: async (): Promise<Ticket[]> => {
    const response = await apiRequest("GET", "/api/tickets");
    return response.json();
  },
  
  getByUserId: async (userId: number): Promise<Ticket[]> => {
    const response = await apiRequest("GET", `/api/tickets?userId=${userId}`);
    return response.json();
  },
  
  updateStatus: async (id: number, status: string): Promise<Ticket> => {
    const response = await apiRequest("PATCH", `/api/tickets/${id}/status`, { status });
    return response.json();
  },
};

export const softwareApi = {
  getAll: async (): Promise<Software[]> => {
    const response = await apiRequest("GET", "/api/software");
    return response.json();
  },
};

export const statsApi = {
  get: async (userId?: number): Promise<TicketStats> => {
    const url = userId ? `/api/stats?userId=${userId}` : "/api/stats";
    const response = await apiRequest("GET", url);
    return response.json();
  },
};
