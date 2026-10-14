import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { dodo } from "@/lib/dodo";

import { db } from "@/db";
import { user as userTable, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session securely on the server
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { user } = session;

    // 1.5 Fetch fresh user record from database
    const freshUser = await db.query.user.findFirst({
      where: eq(userTable.id, user.id),
    });

    if (!freshUser) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    if (freshUser.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts already enjoy complimentary Pro access and do not require a paid plan." },
        { status: 400 }
      );
    }

    // 2. Validate request parameters
    const body = await request.json().catch(() => ({}));
    const plan = body.plan;
    const billingPeriod = body.billingPeriod || "monthly";

    if (plan !== "starter" && plan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan specified. Supported plans are 'starter' or 'pro'." },
        { status: 400 }
      );
    }

    if (billingPeriod !== "monthly" && billingPeriod !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing period specified. Supported options are 'monthly' or 'annual'." },
        { status: 400 }
      );
    }

    // 2.5 Prevent duplicate subscription if already active on requested tier
    const activeSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      ),
    });

    if (activeSub && activeSub.plan === plan) {
      return NextResponse.json(
        { error: `You already have an active ${plan === "pro" ? "Pro" : "Starter"} subscription.` },
        { status: 400 }
      );
    }

    let productId: string | undefined;

    if (plan === "starter") {
      productId = billingPeriod === "annual" 
        ? process.env.DODO_STARTER_ANNUAL_PRODUCT_ID 
        : process.env.DODO_STARTER_MONTHLY_PRODUCT_ID;
    } else {
      productId = billingPeriod === "annual" 
        ? process.env.DODO_PRO_ANNUAL_PRODUCT_ID 
        : process.env.DODO_PRO_MONTHLY_PRODUCT_ID || process.env.DODO_PRO_PRODUCT_ID; // fallback to legacy
    }

    if (!productId || productId === "p_placeholder" || productId === "") {
      console.error(`Missing Dodo Payments Product ID for plan=${plan}, billingPeriod=${billingPeriod}`);
      return NextResponse.json(
        { error: `Billing setup is incomplete for plan: ${plan} (${billingPeriod}). Please configure your Product IDs in .env` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 3. Create checkout session using Dodo Payments SDK
    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
        name: user.name,
      },
      metadata: {
        userId: user.id,
      },
      return_url: `${appUrl}/dashboard`,
      cancel_url: `${appUrl}/dashboard`,
    });

    // 4. Return checkout session URL to trigger redirection in the client
    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url,
    });
  } catch (error: any) {
    console.error("Error creating Dodo Payments checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
