import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { loginSchema, adminLoginSchema, insertTicketSchema, insertTicketAttachmentSchema, insertSoftwareSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Authentication middleware - checks for user session
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For now, we'll check if there's a user header passed from the frontend
  // In a real app, this would validate a session token or JWT
  const userId = req.headers['x-user-id'] as string;
  const username = req.headers['x-username'] as string;
  const isAdmin = req.headers['x-is-admin'] === 'true';
  
  if (!userId || !username) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Add user info to request for use in route handlers
  (req as any).user = {
    id: parseInt(userId),
    username,
    isAdmin
  };
  
  next();
}

// Authorization middleware - checks if user can access a specific ticket
async function requireTicketAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const ticketId = parseInt(req.params.id || req.params.ticketId);
  
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const ticket = await storage.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    // Allow access if user is admin or ticket owner
    if (user.isAdmin || ticket.userId === user.id) {
      next();
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/validate", async (req, res) => {
    try {
      const { employeeId, username } = loginSchema.parse(req.body);
      
      const user = await storage.validateUser(employeeId, username);
      
      if (!user) {
        return res.status(404).json({ 
          message: "Invalid credentials. Please check your Employee ID and Username." 
        });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid request data" 
      });
    }
  });

  // Admin authentication route
  app.post("/api/auth/admin", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      
      const user = await storage.validateAdmin(username, password);
      
      if (!user) {
        return res.status(404).json({ 
          message: "Invalid admin credentials. Please check your Username and Password." 
        });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid request data" 
      });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ticket routes
  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      
      // Validate user exists
      if (ticketData.userId) {
        const user = await storage.getUser(ticketData.userId);
        if (!user) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
      }
      
      // Validate software exists if provided
      if (ticketData.softwareId) {
        const software = await storage.getSoftwareById(ticketData.softwareId);
        if (!software) {
          return res.status(400).json({ message: "Invalid software ID" });
        }
      }
      
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid ticket data" 
      });
    }
  });

  app.get("/api/tickets", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let tickets;
      if (userId) {
        tickets = await storage.getTicketsByUserId(userId);
      } else {
        tickets = await storage.getAllTickets();
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicketById(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const ticket = await storage.updateTicketStatus(id, status);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Software catalog routes
  app.get("/api/software", async (req, res) => {
    try {
      const software = await storage.getAllSoftware();
      res.json(software);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin-only route to upload software CSV
  app.post("/api/admin/software/upload-csv", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid CSV data" });
      }

      const addedSoftware = [];
      for (const row of csvData) {
        try {
          const softwareData = insertSoftwareSchema.parse(row);
          // Convert null to undefined to match TypeScript types
          const normalizedData = {
            ...softwareData,
            version: softwareData.version === null ? undefined : softwareData.version
          };
          const software = await storage.addSoftware(normalizedData);
          addedSoftware.push(software);
        } catch (error) {
          console.error("Failed to add software:", error);
          // Continue processing other rows
        }
      }

      res.json({ 
        message: `Successfully added ${addedSoftware.length} software items`,
        addedSoftware 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin-only route to download sample CSV
  app.get("/api/admin/software/sample-csv", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const sampleData = [
        { name: "Microsoft Office", version: "2021" },
        { name: "Adobe Photoshop", version: "2023" },
        { name: "Visual Studio Code", version: "Latest" },
        { name: "AutoCAD", version: "2024" },
        { name: "Slack", version: "Latest" }
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="software-template.csv"');
      
      const csvHeader = "name,version\n";
      const csvRows = sampleData.map(item => `"${item.name}","${item.version}"`).join('\n');
      const csvContent = csvHeader + csvRows;
      
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint for Docker
  app.get("/api/health", async (req, res) => {
    try {
      // Test actual database connectivity with a simple query
      const result = await db.execute(sql`SELECT 1 as health_check`);
      if (result.rows.length > 0) {
        res.status(200).json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          database: "connected",
          version: "1.0.0"
        });
      } else {
        throw new Error("Database query returned no results");
      }
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed"
      });
    }
  });

  // Statistics routes
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stats = await storage.getTicketStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ticket history routes
  app.get("/api/tickets/:id/history", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getTicketHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ticket attachment routes (protected)
  app.get("/api/tickets/:id/attachments", requireAuth, requireTicketAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attachments = await storage.getTicketAttachments(id);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tickets/:id/attachments", requireAuth, requireTicketAccess, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const user = (req as any).user;
      const attachmentData = insertTicketAttachmentSchema.parse({
        ...req.body,
        ticketId
      });
      
      // Verify the objectPath is valid and belongs to allowed namespace
      const objectStorageService = new ObjectStorageService();
      try {
        // Validate that the object exists in our storage
        await objectStorageService.getObjectEntityFile(attachmentData.objectPath);
      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          return res.status(400).json({ message: "Invalid object path" });
        }
        throw error;
      }
      
      const attachment = await storage.addTicketAttachment(attachmentData);
      res.status(201).json(attachment);
    } catch (error) {
      res.status(400).json({ message: "Invalid attachment data" });
    }
  });

  app.delete("/api/tickets/:ticketId/attachments/:id", requireAuth, requireTicketAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTicketAttachment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object storage routes for file uploads (protected)
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Convert the upload URL to the normalized object path that the frontend should use
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded files with authorization
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      // Extract object path from URL
      const objectPath = req.path;
      
      // Find which attachment record corresponds to this object path
      const attachment = await storage.getAttachmentByObjectPath(objectPath);
      if (!attachment) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Get the ticket to verify ownership
      if (!attachment.ticketId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const ticket = await storage.getTicketById(attachment.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if user is authorized to access this file
      // User must be the ticket owner OR admin
      if (!user.isAdmin && ticket.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
