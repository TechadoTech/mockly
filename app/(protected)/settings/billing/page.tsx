import React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mockups, subscriptions, exportLogs, users } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { ThemeToggle } from "@/components/theme-toggle";
import SignOutButton from "../../dashboard/sign-out-button";
import { BillingClient } from "./billing-client";
import { UserProfileBadge } from "@/components/user-profile-badge";

export default async function BillingSettingsPage() {
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

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  // 1. Fetch the user's latest subscription record & determine effective plan
  const userSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
    orderBy: [desc(subscriptions.createdAt)],
  });

  let effectivePlan: "free" | "starter" | "pro" = (user.plan as any) || "free";
  if (effectivePlan !== "free" && user.role !== "admin") {
    if (!userSub) {
      effectivePlan = "free";
      await db.update(users).set({ plan: "free" }).where(eq(users.id, user.id));
      user.plan = "free";
    } else if (
      (userSub.status === "cancelled" || userSub.status === "failed" || userSub.status === "expired" || userSub.status === "pending_cancellation" || userSub.status === "on_hold" || userSub.status === "paused") &&
      userSub.currentPeriodEnd &&
      new Date(userSub.currentPeriodEnd) < new Date()
    ) {
      effectivePlan = "free";
      await db.update(users).set({ plan: "free" }).where(eq(users.id, user.id));
      user.plan = "free";
    } else if (userSub.status !== "active" && userSub.status !== "pending_cancellation") {
      effectivePlan = "free";
      await db.update(users).set({ plan: "free" }).where(eq(users.id, user.id));
      user.plan = "free";
    }
  }

  // 2. Fetch current month mockup usage count (tamper-proof via exportLogs)
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

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      
      {/* Background Decorative Glow Blobs */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1000px] h-[400px] rounded-full blur-[120px] pointer-events-none z-0 opacity-30" 
        style={{
          background: "radial-gradient(circle, var(--glow-blob-1) 0%, var(--glow-blob-2) 40%, transparent 80%)"
        }}
      />

      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-20" 
        style={{
          backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: "48px 48px"
        }}
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/50 backdrop-blur-md py-4 px-6 md:px-8 relative">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-all">
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
            <span className="text-xs font-semibold text-text-muted hidden sm:inline-block">
              Billing Settings
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

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 pb-28 md:py-12">
        
        {/* Back Link to Dashboard */}
        <div className="mb-6 text-left">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-foreground-pure transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Page Title */}
        <section className="mb-10 text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground-pure leading-tight">
            Account Billing
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your subscription tier, billing period, and monthly export usages.
          </p>
        </section>

        {/* Billing Client Interface Card */}
        <BillingClient 
          plan={effectivePlan} 
          status={userSub ? userSub.status : null} 
          currentPeriodEnd={userSub ? userSub.currentPeriodEnd.toISOString() : null}
          usageCount={currentMonthUsage}
        />

      </main>

    </div>
  );
}
