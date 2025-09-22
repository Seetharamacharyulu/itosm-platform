import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // For admin users only
  isAdmin: boolean("is_admin").default(false),
});

export const softwareCatalog = pgTable("software_catalog", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  requestType: varchar("request_type", { length: 50 }).notNull(),
  softwareId: integer("software_id").references(() => softwareCatalog.id),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("Start"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ticketHistory = pgTable("ticket_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id),
  status: varchar("status", { length: 50 }).notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ticketAttachments = pgTable("ticket_attachments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 100 }),
  objectPath: varchar("object_path", { length: 512 }).notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
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
