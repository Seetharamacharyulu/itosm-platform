// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

/**
 * MySQL configuration for Drizzle
 * Requires .env values:
 *   MYSQL_HOST=localhost
 *   MYSQL_PORT=3306
 *   MYSQL_DATABASE=itosm_production
 *   MYSQL_USER=itosm_admin
 *   MYSQL_PASSWORD=AdminPassword456!
 *
 * Adjust `schema` glob if your schema files live elsewhere.
 */
export default defineConfig({
  dialect: "mysql",
  schema: "./server/db/schema/**/*.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
  },
});
