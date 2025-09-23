import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Initialize database connection
function initializeDatabase() {
  // Use SQLite for development, MySQL for production
  if (process.env.NODE_ENV === 'production') {
    // For production - use MySQL (will be configured in deployment)
    const mysql = require('mysql2/promise');
    const { drizzle: drizzleMySQL } = require('drizzle-orm/mysql2');
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for production");
    }
    
    const connection = mysql.createConnection(process.env.DATABASE_URL);
    return drizzleMySQL(connection, { schema, mode: 'default' });
  } else {
    // For development - use SQLite
    const sqlite = new Database('./dev-database.sqlite');
    return drizzle(sqlite, { schema });
  }
}

export const db = initializeDatabase();