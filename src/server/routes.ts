import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBuildingSchema, insertApartmentSchema, insertExpenseSchema } from "../shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { supabase } from "./supabase";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-05-28.basil" })
  : null;

const JWT_SECRET = process.env.JWT_SECRET || "super-admin-secret-key-change-in-production";

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

  if (error || !authUser) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  const user = await storage.getUser(authUser.id);
  if (!user) {
    return res.status(401).json({ error: "User not synced in database" });
  }
  
  (req as any).user = user;
  next();
}

async function superAdminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const admin = await storage.getSuperAdmin(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: "Invalid token" });
    }
    (req as any).superAdmin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  console.log("[routes] Registering routes...");

  // Super Admin Routes
  app.post("/api/super-admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const admin = await storage.getSuperAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
        }
      });
    } catch (error) {
      console.error("Super admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/super-admin/setup", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, setupKey } = req.body;
      
      if (setupKey !== "COMMON_EXPENSE_SETUP_2024") {
        return res.status(403).json({ error: "Invalid setup key" });
      }

      const existing = await storage.getSuperAdminByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Super admin already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const admin = await storage.createSuperAdmin({
        email,
        passwordHash,
        fullName,
      });

      res.json({ success: true, adminId: admin.id });
    } catch (error) {
      console.error("Super admin setup error:", error);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  app.use("/api/super-admin/protected", superAdminAuthMiddleware);

  app.get("/api/super-admin/protected/profile", (req: Request, res: Response) => {
    const admin = (req as any).superAdmin;
    res.json({ id: admin.id, email: admin.email, fullName: admin.fullName });
  });

  app.post("/api/super-admin/protected/change-password", async (req: Request, res: Response) => {
    try {
      const admin = (req as any).superAdmin;
      const { currentPassword, newPassword } = req.body;

      const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateSuperAdmin(admin.id, { passwordHash });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/super-admin/protected/managers", async (req: Request, res: Response) => {
    try {
      const managers = await storage.getUsersByRole("manager");
      res.json(managers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch managers" });
    }
  });

  app.post("/api/super-admin/protected/managers", async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone } = req.body;
      
      if (!fullName || fullName.trim() === "") {
        return res.status(400).json({ error: "Full name is required" });
      }
      
      // Check if email already exists
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: "A user with this email already exists" });
        }
      }
      
      const manager = await storage.createUser({
        id: crypto.randomUUID(),
        fullName: fullName.trim(),
        email: email || null,
        phone: phone || null,
        role: "manager",
      });
      res.json(manager);
    } catch (error) {
      console.error("Failed to create manager:", error);
      res.status(500).json({ error: "Failed to create manager" });
    }
  });

  app.patch("/api/super-admin/protected/managers/:id", async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone } = req.body;
      const manager = await storage.updateUser(req.params.id, { fullName, email, phone });
      res.json(manager);
    } catch (error) {
      res.status(500).json({ error: "Failed to update manager" });
    }
  });

  app.delete("/api/super-admin/protected/managers/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete manager" });
    }
  });

  app.get("/api/super-admin/protected/residents", async (req: Request, res: Response) => {
    try {
      const residents = await storage.getUsersByRole(["owner", "tenant"]);
      res.json(residents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch residents" });
    }
  });

  app.get("/api/super-admin/protected/subscriptions", async (req: Request, res: Response) => {
    try {
      const subs = await storage.getSubscriptions();
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/super-admin/protected/stats", async (req: Request, res: Response) => {
    try {
      const managers = await storage.getUsersByRole("manager");
      const residents = await storage.getUsersByRole(["owner", "tenant"]);
      const buildings = await storage.getBuildings();
      const subs = await storage.getSubscriptions();
      
      res.json({
        totalManagers: managers.length,
        totalResidents: residents.length,
        totalBuildings: buildings.length,
        totalSubscriptions: subs.length,
        activeSubscriptions: subs.filter((s: any) => s.status === "active").length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Public route to check if phone is registered
  app.post("/api/users/check-phone", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      const user = await storage.getUserByPhone(phone);
      if (user) {
        res.json({ exists: true, role: user.role });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to check phone" });
    }
  });

  // Public route for user sync (called after Supabase signup/login)
  app.post("/api/users/sync", async (req: Request, res: Response) => {
    try {
      const { id, email, fullName, role, phone } = req.body;
      
      let user = await storage.getUser(id);
      if (user) return res.json(user);

      if (phone) {
        user = await storage.getUserByPhone(phone);
        if (user) {
          user = await storage.updateUser(user.id, { id, email, fullName });
          return res.json(user);
        }
      }

      return res.status(403).json({ error: "Phone not registered. Please contact your building manager." });
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  app.use("/api/protected", authMiddleware);

  app.get("/api/protected/profile", (req: Request, res: Response) => {
    res.json((req as any).user);
  });

  app.get("/api/protected/buildings", async (req: Request, res: Response) => {
    const buildings = await storage.getBuildings();
    res.json(buildings);
  });

  app.post("/api/protected/buildings", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });

      const result = insertBuildingSchema.safeParse({ ...req.body, managerId: user.id });
      if (!result.success) return res.status(400).json({ error: result.error.message });

      const building = await storage.createBuilding(result.data);
      res.json(building);
    } catch (error) {
      res.status(500).json({ error: "Failed to create building" });
    }
  });

  app.patch("/api/protected/buildings/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });
      const building = await storage.updateBuilding(req.params.id, req.body);
      res.json(building);
    } catch (error) {
      res.status(500).json({ error: "Failed to update building" });
    }
  });

  app.delete("/api/protected/buildings/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });
      await storage.deleteBuilding(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete building" });
    }
  });

  app.get("/api/protected/apartments", async (req: Request, res: Response) => {
    const buildingId = req.query.buildingId as string;
    const apartments = await storage.getApartments(buildingId);
    res.json(apartments);
  });

  app.post("/api/protected/apartments", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });

      const result = insertApartmentSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.message });

      const apartment = await storage.createApartment(result.data);
      res.json(apartment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create apartment" });
    }
  });

  app.patch("/api/protected/apartments/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });
      const apartment = await storage.updateApartment(req.params.id, req.body);
      res.json(apartment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update apartment" });
    }
  });

  app.delete("/api/protected/apartments/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });
      await storage.deleteApartment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete apartment" });
    }
  });

  app.get("/api/protected/expenses", async (req: Request, res: Response) => {
    const filters = {
      buildingId: req.query.buildingId as string,
      apartmentId: req.query.apartmentId as string,
      status: req.query.status as string,
    };
    const expenses = await storage.getExpenses(filters);
    res.json(expenses);
  });

  app.post("/api/protected/expenses", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user.role !== "manager") return res.status(403).json({ error: "Forbidden" });

      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.message });

      const expense = await storage.createExpense(result.data);
      
      if (expense.apartmentId) {
        const apt = await storage.getApartment(expense.apartmentId);
        if (apt?.residentId) {
          await storage.createNotification({
            userId: apt.residentId,
            title: "New Expense",
            message: `A new expense of €${expense.amount} has been issued for your apartment.`,
            type: "alert",
          });
        }
      }

      res.json(expense);
    } catch (error) {
      console.error("Create expense error:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.get("/api/protected/notifications", async (req: Request, res: Response) => {
    const user = (req as any).user;
    const notifications = await storage.getNotifications(user.id);
    res.json(notifications);
  });

  app.post("/api/protected/notifications/:id/read", async (req: Request, res: Response) => {
    await storage.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

app.post("/api/protected/create-checkout-session", async (req: Request, res: Response) => {
      try {
        if (!stripe) {
          return res.status(503).json({ error: "Stripe not configured" });
        }

        const user = (req as any).user;
        const { expenseId } = req.body;

        if (!expenseId) {
          return res.status(400).json({ error: "expenseId is required" });
        }

        const expense = await storage.getExpense(expenseId);
        if (!expense) {
          return res.status(404).json({ error: "Expense not found" });
        }

        if (expense.status === "paid") {
          return res.status(400).json({ error: "Expense already paid" });
        }

        const amountInCents = Math.round(Number(expense.amount) * 100);

        const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: expense.title,
                description: expense.description || `Expense payment for ${expense.category}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          expenseId: expense.id,
          userId: user.id,
        },
        success_url: `${req.headers.origin || "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || "http://localhost:3000"}/payment-cancel`,
      });

      await storage.createPayment({
        expenseId: expense.id,
        userId: user.id,
        amount: expense.amount,
        stripeSessionId: session.id,
        status: "pending",
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  return httpServer;
}
