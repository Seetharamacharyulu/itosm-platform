import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertTicketSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
