import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// 1. Users Table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  plan: text("plan").$type<"free" | "starter" | "pro">().default("free").notNull(),
  role: text("role").$type<"admin" | "user">().default("user").notNull(),
  onboardingAnswers: jsonb("onboarding_answers"),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  figmaToken: text("figma_token"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Alias to support the requested plural name
export const users = user;

// 2. Sessions Table (required and handled by better-auth)
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Alias to support the requested plural name
export const sessions = session;

// 3. Accounts Table (required and handled by better-auth)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const accounts = account;

// 4. Verification Table (required and handled by better-auth)
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const verifications = verification;

// 5. Mockups Table
export const mockups = pgTable("mockups", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  screenshotUrl: text("screenshot_url"),
  mockupUrl: text("mockup_url"),
  deviceFrame: text("device_frame"),
  background: text("background"),
  tilt: text("tilt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  dodoSubscriptionId: text("dodo_subscription_id").notNull().unique(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Export Logs Table (Tracks monthly export usage permanently, independent of deleted saved mockups)
export const exportLogs = pgTable("export_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
