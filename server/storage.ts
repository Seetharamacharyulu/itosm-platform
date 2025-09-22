import { users, tickets, softwareCatalog, ticketHistory, ticketAttachments, type User, type InsertUser, type Ticket, type InsertTicket, type Software, type TicketHistory, type TicketAttachment, type InsertTicketAttachment } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  validateUser(employeeId: string, username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  getTicketsByUserId(userId: number): Promise<Ticket[]>;
  getAllTickets(): Promise<Ticket[]>;
  updateTicketStatus(id: number, status: string): Promise<Ticket | undefined>;
  
  // Software operations
  getAllSoftware(): Promise<Software[]>;
  getSoftwareById(id: number): Promise<Software | undefined>;
  
  // Ticket history operations
  addTicketHistory(history: { ticketId: number; status: string; notes?: string }): Promise<TicketHistory>;
  getTicketHistory(ticketId: number): Promise<TicketHistory[]>;
  
  // Ticket attachment operations
  addTicketAttachment(attachment: InsertTicketAttachment): Promise<TicketAttachment>;
  getTicketAttachments(ticketId: number): Promise<TicketAttachment[]>;
  deleteTicketAttachment(id: number): Promise<boolean>;
  
  // Statistics
  getTicketStats(userId?: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  }>;
  
  // Generate unique ticket ID
  generateTicketId(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.employeeId, employeeId));
    return user || undefined;
  }

  async validateUser(employeeId: string, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.employeeId, employeeId), eq(users.username, username))
    );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const ticketId = await this.generateTicketId();
    const [ticket] = await db.insert(tickets).values({
      ...insertTicket,
      ticketId,
    }).returning();
    
    // Add initial history entry
    await this.addTicketHistory({
      ticketId: ticket.id,
      status: ticket.status || "Start",
      notes: "Ticket created"
    });
    
    return ticket;
  }

  async getTicketById(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketId, ticketId));
    return ticket || undefined;
  }

  async getTicketsByUserId(userId: number): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async updateTicketStatus(id: number, status: string): Promise<Ticket | undefined> {
    const [ticket] = await db.update(tickets)
      .set({ status })
      .where(eq(tickets.id, id))
      .returning();
    
    if (ticket) {
      await this.addTicketHistory({
        ticketId: ticket.id,
        status,
        notes: `Status updated to ${status}`
      });
    }
    
    return ticket || undefined;
  }

  async getAllSoftware(): Promise<Software[]> {
    return await db.select().from(softwareCatalog);
  }

  async getSoftwareById(id: number): Promise<Software | undefined> {
    const [software] = await db.select().from(softwareCatalog).where(eq(softwareCatalog.id, id));
    return software || undefined;
  }

  async addTicketHistory(history: { ticketId: number; status: string; notes?: string }): Promise<TicketHistory> {
    const [historyEntry] = await db.insert(ticketHistory).values(history).returning();
    return historyEntry;
  }

  async getTicketHistory(ticketId: number): Promise<TicketHistory[]> {
    return await db.select().from(ticketHistory)
      .where(eq(ticketHistory.ticketId, ticketId))
      .orderBy(desc(ticketHistory.updatedAt));
  }

  async addTicketAttachment(attachment: InsertTicketAttachment): Promise<TicketAttachment> {
    const [attachmentEntry] = await db.insert(ticketAttachments).values(attachment).returning();
    return attachmentEntry;
  }

  async getTicketAttachments(ticketId: number): Promise<TicketAttachment[]> {
    return await db.select().from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, ticketId))
      .orderBy(desc(ticketAttachments.uploadedAt));
  }

  async getAttachmentByObjectPath(objectPath: string): Promise<TicketAttachment | null> {
    const results = await db.select().from(ticketAttachments)
      .where(eq(ticketAttachments.objectPath, objectPath))
      .limit(1);
    
    return results[0] || null;
  }

  async deleteTicketAttachment(id: number): Promise<boolean> {
    try {
      await db.delete(ticketAttachments).where(eq(ticketAttachments.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTicketStats(userId?: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  }> {
    let allTickets;
    
    if (userId) {
      allTickets = await db.select().from(tickets).where(eq(tickets.userId, userId));
    } else {
      allTickets = await db.select().from(tickets);
    }
    
    return {
      total: allTickets.length,
      pending: allTickets.filter(t => t.status === "Pending").length,
      inProgress: allTickets.filter(t => t.status === "In Progress").length,
      resolved: allTickets.filter(t => t.status === "Resolved").length,
      urgent: allTickets.filter(t => t.status === "Urgent").length,
    };
  }

  async generateTicketId(): Promise<string> {
    const year = new Date().getFullYear();
    const allTickets = await db.select().from(tickets);
    const currentYearTickets = allTickets.filter(t => 
      t.ticketId?.startsWith(`INC-${year}-`)
    );
    const nextNumber = currentYearTickets.length + 1;
    return `INC-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }
}

export const storage = new DatabaseStorage();
