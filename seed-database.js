// Sample data insertion script for SQLite development database
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './shared/schema.js';

const sqlite = new Database('./dev-database.sqlite');
const db = drizzle(sqlite, { schema });

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');

  try {
    // Insert sample software catalog
    const softwareData = [
      { name: 'Microsoft Office 365', version: '2024' },
      { name: 'Adobe Creative Suite', version: '2024' },
      { name: 'Slack', version: '4.34.0' },
      { name: 'Zoom', version: '5.15.0' },
      { name: 'AutoCAD', version: '2024' },
      { name: 'Visual Studio Code', version: '1.82.0' },
      { name: 'TeamViewer', version: '15.44.0' },
      { name: 'VPN Client', version: '3.4.0' },
      { name: 'Google Chrome', version: 'Latest' },
      { name: 'Mozilla Firefox', version: 'Latest' }
    ];

    console.log('📦 Inserting software catalog...');
    const softwareResults = await db.insert(schema.softwareCatalog).values(softwareData).returning();
    console.log(`✅ Inserted ${softwareResults.length} software items`);

    // Insert sample users
    const userData = [
      { username: 'admin', employeeId: 'ADMIN001', isAdmin: true, password: 'AdminPass123!' },
      { username: 'john.smith', employeeId: 'EMP001', isAdmin: false, password: null },
      { username: 'sarah.johnson', employeeId: 'EMP002', isAdmin: false, password: null },
      { username: 'mike.davis', employeeId: 'EMP003', isAdmin: false, password: null },
      { username: 'lisa.wilson', employeeId: 'EMP004', isAdmin: false, password: null },
      { username: 'david.brown', employeeId: 'EMP005', isAdmin: false, password: null }
    ];

    console.log('👥 Inserting users...');
    const userResults = await db.insert(schema.users).values(userData).returning();
    console.log(`✅ Inserted ${userResults.length} users`);

    // Insert sample tickets
    const ticketData = [
      {
        ticketId: 'TIC-001',
        userId: 2, // john.smith
        requestType: 'Installation',
        softwareId: 1, // Microsoft Office 365
        description: 'Need Microsoft Office 365 installed on new laptop for accounting department',
        status: 'Start'
      },
      {
        ticketId: 'TIC-002',
        userId: 3, // sarah.johnson
        requestType: 'License',
        softwareId: 2, // Adobe Creative Suite
        description: 'Requesting Adobe Creative Suite license for marketing team member',
        status: 'In Progress'
      },
      {
        ticketId: 'TIC-003',
        userId: 4, // mike.davis
        requestType: 'Setup',
        softwareId: 8, // VPN Client
        description: 'Employee working remotely needs VPN client configured',
        status: 'Start'
      },
      {
        ticketId: 'TIC-004',
        userId: 5, // lisa.wilson
        requestType: 'Renewal',
        softwareId: 5, // AutoCAD
        description: 'Current AutoCAD license expires next month, need renewal',
        status: 'Pending'
      },
      {
        ticketId: 'TIC-005',
        userId: 6, // david.brown
        requestType: 'Installation',
        softwareId: 3, // Slack
        description: 'Need Slack configured for new project team communication',
        status: 'Completed'
      }
    ];

    console.log('🎫 Inserting tickets...');
    const ticketResults = await db.insert(schema.tickets).values(ticketData).returning();
    console.log(`✅ Inserted ${ticketResults.length} tickets`);

    // Insert sample ticket history
    const historyData = [
      { ticketId: 1, status: 'Start', notes: 'Ticket created - Office installation request' },
      { ticketId: 2, status: 'Start', notes: 'Adobe license request submitted' },
      { ticketId: 2, status: 'In Progress', notes: 'Approved by manager, processing license' },
      { ticketId: 3, status: 'Start', notes: 'VPN setup request for remote employee' },
      { ticketId: 4, status: 'Pending', notes: 'License renewal request pending budget approval' },
      { ticketId: 5, status: 'Start', notes: 'Slack setup request' },
      { ticketId: 5, status: 'Completed', notes: 'Slack successfully configured and user trained' }
    ];

    console.log('📝 Inserting ticket history...');
    const historyResults = await db.insert(schema.ticketHistory).values(historyData).returning();
    console.log(`✅ Inserted ${historyResults.length} history entries`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Software Items: ${softwareResults.length}`);
    console.log(`   Users: ${userResults.length}`);
    console.log(`   Tickets: ${ticketResults.length}`);
    console.log(`   History Entries: ${historyResults.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

seedDatabase();