export interface User {
  id: number;
  username: string;
  employeeId: string;
  isAdmin: boolean;
}

export interface Ticket {
  id: number;
  ticketId: string;
  userId: number;
  requestType: string;
  softwareId?: number;
  description?: string;
  status: string;
  createdAt: string;
}

export interface Software {
  id: number;
  name: string;
  version?: string;
}

export interface TicketStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

export interface LoginCredentials {
  employeeId: string;
  username: string;
}

export interface CreateTicketData {
  userId: number;
  requestType: string;
  softwareId?: number;
  description: string;
}
