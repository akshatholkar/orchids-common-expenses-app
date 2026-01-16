import { 
    users, buildings, apartments, expenses, payments, notifications, subscriptions, superAdmins
  } from "../shared/schema";
  import type { 
    User, InsertUser, Building, InsertBuilding, Apartment, InsertApartment, 
    Expense, InsertExpense, Payment, InsertPayment, Notification, InsertNotification,
    SuperAdmin, InsertSuperAdmin
  } from "../shared/schema";
  import { db } from "./db";
  import { eq, and, or, inArray } from "drizzle-orm";
  
  export interface IStorage {
    // User operations
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByPhone(phone: string): Promise<User | undefined>;
    getUsersByRole(role: string | string[]): Promise<User[]>;
    createUser(user: InsertUser): Promise<User>;
    updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
    deleteUser(id: string): Promise<void>;
    
    // Building operations
    getBuildings(): Promise<Building[]>;
    getBuilding(id: string): Promise<Building | undefined>;
    createBuilding(building: InsertBuilding): Promise<Building>;
    updateBuilding(id: string, building: Partial<InsertBuilding>): Promise<Building | undefined>;
    deleteBuilding(id: string): Promise<void>;
    
    // Apartment operations
    getApartments(buildingId?: string): Promise<Apartment[]>;
    getApartment(id: string): Promise<Apartment | undefined>;
    createApartment(apartment: InsertApartment): Promise<Apartment>;
    updateApartment(id: string, apartment: Partial<InsertApartment>): Promise<Apartment | undefined>;
    deleteApartment(id: string): Promise<void>;
    syncResidentUsers(apartment: Apartment): Promise<void>;

    // Subscription operations
    getSubscriptions(): Promise<any[]>;
    
    // Expense operations
  getExpenses(filters?: { buildingId?: string, apartmentId?: string, status?: string }): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: string, status: "pending" | "paid"): Promise<Expense | undefined>;
  
  // Payment operations
  getPayments(userId?: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByExpenseId(expenseId: string): Promise<Payment | undefined>;
  getPaymentByPaymentIntentId(paymentIntentId: string): Promise<Payment | undefined>;
  getPaymentBySessionId(sessionId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: "pending" | "completed" | "failed"): Promise<Payment | undefined>;
  updatePaymentByPaymentIntentId(paymentIntentId: string, status: "pending" | "completed" | "failed"): Promise<Payment | undefined>;
  updatePaymentBySessionId(sessionId: string, update: { status: "pending" | "completed" | "failed"; stripePaymentIntentId?: string }): Promise<Payment | undefined>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Super Admin operations
  getSuperAdmin(id: string): Promise<SuperAdmin | undefined>;
  getSuperAdminByEmail(email: string): Promise<SuperAdmin | undefined>;
  createSuperAdmin(admin: InsertSuperAdmin): Promise<SuperAdmin>;
  updateSuperAdmin(id: string, admin: Partial<InsertSuperAdmin>): Promise<SuperAdmin | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUsersByRole(role: string | string[]): Promise<User[]> {
    if (Array.isArray(role)) {
      return await db.select().from(users).where(inArray(users.role, role as any));
    }
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getBuildings(): Promise<Building[]> {
    return await db.select().from(buildings);
  }

  async getBuilding(id: string): Promise<Building | undefined> {
    const [building] = await db.select().from(buildings).where(eq(buildings.id, id));
    return building;
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const [building] = await db.insert(buildings).values(insertBuilding).returning();
    return building;
  }

  async updateBuilding(id: string, building: Partial<InsertBuilding>): Promise<Building | undefined> {
    const [updated] = await db.update(buildings)
      .set(building)
      .where(eq(buildings.id, id))
      .returning();
    return updated;
  }

  async deleteBuilding(id: string): Promise<void> {
    await db.delete(buildings).where(eq(buildings.id, id));
  }

  async getApartments(buildingId?: string): Promise<Apartment[]> {
    if (buildingId) {
      return await db.select().from(apartments).where(eq(apartments.buildingId, buildingId));
    }
    return await db.select().from(apartments);
  }

  async getApartment(id: string): Promise<Apartment | undefined> {
    const [apartment] = await db.select().from(apartments).where(eq(apartments.id, id));
    return apartment;
  }

  async createApartment(insertApartment: InsertApartment): Promise<Apartment> {
    const [apartment] = await db.insert(apartments).values(insertApartment).returning();
    await this.syncResidentUsers(apartment);
    return apartment;
  }

  async updateApartment(id: string, apartment: Partial<InsertApartment>): Promise<Apartment | undefined> {
    const [updated] = await db.update(apartments)
      .set(apartment)
      .where(eq(apartments.id, id))
      .returning();
    if (updated) await this.syncResidentUsers(updated);
    return updated;
  }

  async syncResidentUsers(apt: Apartment): Promise<void> {
    const syncUser = async (phone: string | null, fullName: string | null, role: "owner" | "tenant") => {
      if (!phone || !fullName) return;
      
      const existing = await this.getUserByPhone(phone);
      if (existing) {
        await this.updateUser(existing.id, { fullName, role });
      } else {
        await this.createUser({
          id: crypto.randomUUID(), // Temp ID, will be updated on first login
          phone,
          fullName,
          role,
        });
      }
    };

    await syncUser(apt.ownerPhone, apt.ownerName, "owner");
    if (apt.tenantPhone) {
      await syncUser(apt.tenantPhone, apt.tenantName, "tenant");
    }
  }

  async getSubscriptions(): Promise<any[]> {
    return await db.select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      stripePriceId: subscriptions.stripePriceId,
      users: {
        fullName: users.fullName
      }
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id));
  }

  async deleteApartment(id: string): Promise<void> {
    await db.delete(apartments).where(eq(apartments.id, id));
  }

  async getExpenses(filters?: { buildingId?: string, apartmentId?: string, status?: string }): Promise<Expense[]> {
    let query = db.select().from(expenses);
    const conditions = [];
    if (filters?.buildingId) conditions.push(eq(expenses.buildingId, filters.buildingId));
    if (filters?.apartmentId) conditions.push(eq(expenses.apartmentId, filters.apartmentId));
    if (filters?.status) conditions.push(eq(expenses.status, filters.status as any));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    return await query;
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpenseStatus(id: string, status: "pending" | "paid"): Promise<Expense | undefined> {
    const [expense] = await db.update(expenses)
      .set({ status })
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async getPayments(userId?: string): Promise<Payment[]> {
    if (userId) {
      return await db.select().from(payments).where(eq(payments.userId, userId));
    }
    return await db.select().from(payments);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByExpenseId(expenseId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.expenseId, expenseId));
    return payment;
  }

  async getPaymentByPaymentIntentId(paymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntentId));
    return payment;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePaymentStatus(id: string, status: "pending" | "completed" | "failed"): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set({ status, paymentDate: status === "completed" ? new Date() : null })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async updatePaymentByPaymentIntentId(paymentIntentId: string, status: "pending" | "completed" | "failed"): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set({ status, paymentDate: status === "completed" ? new Date() : null })
      .where(eq(payments.stripePaymentIntentId, paymentIntentId))
      .returning();
    return payment;
  }

  async getPaymentBySessionId(sessionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.stripeSessionId, sessionId));
    return payment;
  }

  async updatePaymentBySessionId(sessionId: string, update: { status: "pending" | "completed" | "failed"; stripePaymentIntentId?: string }): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set({ 
        status: update.status, 
        paymentDate: update.status === "completed" ? new Date() : null,
        ...(update.stripePaymentIntentId && { stripePaymentIntentId: update.stripePaymentIntentId })
      })
      .where(eq(payments.stripeSessionId, sessionId))
      .returning();
    return payment;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getSuperAdmin(id: string): Promise<SuperAdmin | undefined> {
    const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.id, id));
    return admin;
  }

  async getSuperAdminByEmail(email: string): Promise<SuperAdmin | undefined> {
    const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.email, email));
    return admin;
  }

  async createSuperAdmin(insertAdmin: InsertSuperAdmin): Promise<SuperAdmin> {
    const [admin] = await db.insert(superAdmins).values(insertAdmin).returning();
    return admin;
  }

  async updateSuperAdmin(id: string, admin: Partial<InsertSuperAdmin>): Promise<SuperAdmin | undefined> {
    const [updated] = await db.update(superAdmins)
      .set({ ...admin, updatedAt: new Date() })
      .where(eq(superAdmins.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
