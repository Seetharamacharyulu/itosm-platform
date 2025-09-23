import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  employeeId: text("employee_id").notNull().unique(),
  password: text("password"), // For admin users only
  isAdmin: integer("is_admin", { mode: 'boolean' }).default(false),
});

export const softwareCatalog = sqliteTable("software_catalog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  version: text("version"),
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: text("ticket_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  requestType: text("request_type").notNull(),
  softwareId: integer("software_id").references(() => softwareCatalog.id),
  description: text("description"),
  status: text("status").default("Start"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ticketHistory = sqliteTable("ticket_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").references(() => tickets.id),
  status: text("status").notNull(),
  notes: text("notes"),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ticketAttachments = sqliteTable("ticket_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").references(() => tickets.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  objectPath: text("object_path").notNull(),
  uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  software: one(softwareCatalog, {
    fields: [tickets.softwareId],
    references: [softwareCatalog.id],
  }),
  history: many(ticketHistory),
  attachments: many(ticketAttachments),
}));

export const softwareCatalogRelations = relations(softwareCatalog, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketHistory.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketAttachmentsRelations = relations(ticketAttachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAttachments.ticketId],
    references: [tickets.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, ticketId: true, createdAt: true });
export const insertSoftwareSchema = createInsertSchema(softwareCatalog).omit({ id: true });
export const insertTicketHistorySchema = createInsertSchema(ticketHistory).omit({ id: true, updatedAt: true });
export const insertTicketAttachmentSchema = createInsertSchema(ticketAttachments).omit({ id: true, uploadedAt: true });

// Auth schemas
export const loginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  username: z.string().min(1, "Username is required"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Software = typeof softwareCatalog.$inferSelect;
export type InsertSoftware = z.infer<typeof insertSoftwareSchema>;
export type TicketHistory = typeof ticketHistory.$inferSelect;
export type InsertTicketHistory = z.infer<typeof insertTicketHistorySchema>;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = z.infer<typeof insertTicketAttachmentSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
