// server/db/schema/core.ts
import {
  mysqlTable,
  serial,
  int,
  varchar,
  boolean,
  timestamp,
  mysqlEnum,
  text,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * USERS
 */
export const users = mysqlTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    employeeId: varchar("employee_id", { length: 32 }),
    isAdmin: boolean("is_admin").notNull().default(false),
    // nullable for non-admin accounts using OTP/employeeId flow
    password: varchar("password", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    uxUsername: uniqueIndex("ux_users_username").on(table.username),
  })
);

/**
 * SOFTWARE CATALOG
 */
export const softwareCatalog = mysqlTable(
  "software_catalog",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 128 }).notNull(),
    version: varchar("version", { length: 32 }).notNull().default("Latest"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    // optional uniqueness across name+version
    uxNameVersion: uniqueIndex("ux_software_name_version").on(table.name, table.version),
  })
);

/**
 * TICKETS
 */
export const tickets = mysqlTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    ticketId: varchar("ticket_id", { length: 32 }).notNull(),
    userId: int("user_id").notNull(),        // can be FK -> users.id in a later migration
    requestType: varchar("request_type", { length: 64 }).notNull(),
    softwareId: int("software_id"),          // nullable when ticket not tied to software
    description: text("description"),
    status: mysqlEnum("status", ["Start", "In Progress", "Pending", "Completed"])
      .notNull()
      .default("Start"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    uxTicketId: uniqueIndex("ux_tickets_ticket_id").on(table.ticketId),
  })
);

/**
 * TICKET HISTORY
 */
export const ticketHistory = mysqlTable("ticket_history", {
  id: serial("id").primaryKey(),
  ticketId: int("ticket_id").notNull(), // can be FK -> tickets.id in a later migration
  status: mysqlEnum("status", ["Start", "In Progress", "Pending", "Completed"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});
