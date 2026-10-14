import React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import SignOutButton from "./sign-out-button";
import { db } from "@/db";
import { mockups, exportLogs, subscriptions, users } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { MockupBuilder } from "./mockup-builder";
import { UserProfileBadge } from "@/components/user-profile-badge";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, session.user.id),
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const user = dbUser;

  // Direct Page-Level Redirection: Block dashboard access if onboarding is incomplete
  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  // Verify active subscription status if marked as paid
  let effectivePlan: "free" | "starter" | "pro" = (user.plan as any) || "free";
  if (effectivePlan !== "free" && user.role !== "admin") {
    const latestSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
      orderBy: [desc(subscriptions.createdAt)],
    });

    if (!latestSub) {
      effectivePlan = "free";
      await db.update(users).set({ plan: "free" }).where(eq(users.id, user.id));
      user.plan = "free";
    } else if (
      (latestSub.status === "cancelled" || latestSub.status === "failed" || latestSub.status === "expired" || latestSub.status === "pending_cancellation" || latestSub.status === "on_hold" || latestSub.status === "paused") &&
      latestSub.currentPeriodEnd &&
      new Date(latestSub.currentPeriodEnd) < new Date()
    ) {
      effectivePlan = "free";
      await db.update(users).set({ plan: "free" }).where(eq(users.id, user.id));
      user.plan = "free";
    } else if (latestSub.status !== "active" && latestSub.status !== "pending_cancellation") {
      effectivePlan = "free";
      await db.update(users).set({ plan: "free" }).where(eq(users.id, user.id));
      user.plan = "free";
    }
  }

  // 1. Calculate current calendar month usage count (tamper-proof against mockup deletion)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthExportLogs = await db
    .select()
    .from(exportLogs)
    .where(
      and(
        eq(exportLogs.userId, user.id),
        gte(exportLogs.createdAt, startOfMonth)
      )
    );

  const monthExportsList = await db
    .select()
    .from(mockups)
    .where(
      and(
        eq(mockups.userId, user.id),
        gte(mockups.createdAt, startOfMonth)
      )
    );

  const currentMonthUsage = Math.max(monthExportLogs.length, monthExportsList.length);

  // 2. Fetch all-time exported mockups history for this user
  const userMockupHistory = await db
    .select()
    .from(mockups)
    .where(eq(mockups.userId, user.id))
    .orderBy(desc(mockups.createdAt));

  // Serialize timestamps to string to comply with Client Component serialization boundary
  const serializedMockups = userMockupHistory.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      
      {/* Background Decorative Glow Blobs */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1000px] h-[400px] rounded-full blur-[120px] pointer-events-none z-0 opacity-40" 
        style={{
          background: "radial-gradient(circle, var(--glow-blob-1) 0%, var(--glow-blob-2) 40%, transparent 80%)"
        }}
      />

      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30" 
        style={{
          backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: "48px 48px"
        }}
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/50 backdrop-blur-md py-4 px-6 md:px-8 relative">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-all">
              <Image 
                src="/logo.png" 
                alt="Muckly Logo" 
                width={30} 
                height={30} 
                className="rounded-lg shadow-lg border border-border-subtle object-cover"
              />
              <span className="text-lg font-bold tracking-tight text-foreground-pure">
                Muckly
              </span>
            </Link>
            <span className="h-4 w-px bg-border-medium hidden sm:inline-block" />
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
              Console
            </span>
            {user.role === "admin" && (
              <>
                <span className="h-4 w-px bg-border-medium hidden sm:inline-block" />
                <Link 
                  href="/admin" 
                  className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full hover:bg-rose-500/20 transition-all animate-pulse"
                >
                  Admin Portal
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserProfileBadge user={{ ...user, plan: effectivePlan }} />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 py-12 pb-28 md:py-12">
        
        {/* Welcome Section */}
        <section className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground-pure leading-tight">
              Welcome, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Create, customize, and export premium 3D screenshot mockups.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-semi-muted">Account Tier:</span>
            <span className="text-xs font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-3.5 py-1 rounded-full shadow-lg shadow-indigo-500/15 select-none">
              {user.role === "admin" ? "Admin (Free Pro Access)" : effectivePlan === "pro" ? "Pro Plan" : effectivePlan === "starter" ? "Starter Plan" : "Free Plan"}
            </span>
          </div>
        </section>

        {/* Mockup Sandbox Component */}
        <MockupBuilder 
          plan={effectivePlan} 
          initialUsage={currentMonthUsage} 
          initialMockups={serializedMockups} 
          userRole={user.role as "admin" | "user"}
        />

      </main>

    </div>
  );
}
