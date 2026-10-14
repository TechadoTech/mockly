import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, mockups } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  // 1. Authenticate Request Session on the Server
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // 2. Enforce Strict Server-Side Role-Based Protection against Live DB Record
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser || dbUser.role !== "admin") {
    redirect("/dashboard");
  }

  // 3. Fetch Database Aggregates for Statistics Cards
  // Total Users
  const totalUsersResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(user);
  const totalUsers = totalUsersResult[0]?.count || 0;

  // Total Mockups Generated
  const totalMockupsResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(mockups);
  const totalMockups = totalMockupsResult[0]?.count || 0;

  // Total Pro Subscribers
  const totalProResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(user)
    .where(eq(user.plan, "pro"));
  const totalProSubscribers = totalProResult[0]?.count || 0;

  // 4. Fetch Users Listing with Mockup Aggregation Counts
  const usersList = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt,
      mockupCount: sql<number>`cast(count(${mockups.id}) as integer)`,
    })
    .from(user)
    .leftJoin(mockups, eq(user.id, mockups.userId))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));

  // 5. Fetch Mockups Listing with Generated User Emails
  const mockupsList = await db
    .select({
      id: mockups.id,
      title: mockups.title,
      screenshotUrl: mockups.screenshotUrl,
      mockupUrl: mockups.mockupUrl,
      deviceFrame: mockups.deviceFrame,
      createdAt: mockups.createdAt,
      userEmail: user.email,
    })
    .from(mockups)
    .innerJoin(user, eq(mockups.userId, user.id))
    .orderBy(desc(mockups.createdAt));

  // 6. Serialize timestamps to ISO strings to pass across Server-Client Boundary safely
  const serializedUsers = usersList.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedMockups = mockupsList.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <AdminDashboard
      adminUser={{
        name: session.user.name,
        email: session.user.email,
      }}
      stats={{
        totalUsers,
        totalMockups,
        totalProSubscribers,
      }}
      users={serializedUsers}
      mockups={serializedMockups}
    />
  );
}
