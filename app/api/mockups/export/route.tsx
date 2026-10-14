import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable, mockups, subscriptions, exportLogs } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { imagekit } from "@/lib/imagekit";
import satori from "satori";
import sharp from "sharp";
import React from "react";
import { promises as fs } from "fs";
import path from "path";

// Server Background Mapping matching the client exactly
const BACKEND_BG_STYLES = {
  sunset: "linear-gradient(135deg, #ff5e62 0%, #ff9966 100%)",
  ocean: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
  lavender: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  emerald: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  cyberpunk: "linear-gradient(135deg, #f80759 0%, #bc4e9c 100%)",
  aurora: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  "minimal-frost": "radial-gradient(ellipse at 50% 120%, rgba(186, 230, 253, 0.5) 0%, rgba(240, 249, 255, 0.3) 45%, #ffffff 80%)",
  
  // Solids
  slate: "#334155",
  rose: "#be123c",
  amber: "#b45309",
  teal: "#0f766e",
  violet: "#6d28d9",
  zinc: "#3f3f46",
  white: "#ffffff",
  black: "#000000",

  // Meshes
  candy: "radial-gradient(at 10% 20%, rgba(254, 240, 138, 0.4) 0px, transparent 50%), radial-gradient(at 90% 10%, rgba(253, 164, 175, 0.5) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(165, 180, 252, 0.5) 0px, transparent 50%), #ffffff",
  nebula: "radial-gradient(at 10% 10%, rgba(79, 70, 229, 0.5) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(219, 39, 119, 0.5) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(59, 130, 246, 0.3) 0px, transparent 50%), #0c0f1d",
  retrowave: "radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.4) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(20, 184, 166, 0.4) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.4) 0px, transparent 50%), #030303",
  forest: "radial-gradient(at 20% 0%, rgba(251, 146, 60, 0.5) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(16, 185, 129, 0.4) 0px, transparent 50%), #0d1e1a",
};

const isDesktopFrame = (frameId?: string | null) => {
  return frameId === "MacBook Pro" || frameId === "Safari Browser" || frameId === "Chrome Browser";
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 1.5 Fetch fresh user record directly from database (guarantees ground-truth plan and role)
    const dbUser = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const user = dbUser;

    // 1.6 Verify active subscription status if marked as paid
    let effectivePlan: "free" | "starter" | "pro" = (user.plan as any) || "free";

    if (effectivePlan !== "free" && user.role !== "admin") {
      const latestSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
        orderBy: [desc(subscriptions.createdAt)],
      });

      if (!latestSub) {
        effectivePlan = "free";
        await db.update(userTable).set({ plan: "free" }).where(eq(userTable.id, user.id));
      } else if (
        (latestSub.status === "cancelled" || latestSub.status === "failed" || latestSub.status === "expired" || latestSub.status === "pending_cancellation" || latestSub.status === "on_hold" || latestSub.status === "paused") &&
        latestSub.currentPeriodEnd &&
        new Date(latestSub.currentPeriodEnd) < new Date()
      ) {
        effectivePlan = "free";
        await db.update(userTable).set({ plan: "free" }).where(eq(userTable.id, user.id));
      } else if (latestSub.status !== "active" && latestSub.status !== "pending_cancellation") {
        effectivePlan = "free";
        await db.update(userTable).set({ plan: "free" }).where(eq(userTable.id, user.id));
      }
    }

    // 2. Parse request payload
    const body = await request.json();
    const { 
      title, 
      background, 
      customBgColor, 
      shadowIntensity, 
      paddingLevel, 
      textOverlay, 
      textAccent,
      textAccentColor,
      textPosition, 
      textFontSize,
      textColor,
      textWeight,
      aspectRatio,
      nodes,
      // Legacy backward compatibility parameters
      screenshotUrl,
      deviceFrame,
      tilt
    } = body;

    // Normalize nodes (handles legacy single-device payload seamlessly)
    let canvasNodes = nodes;
    if (!canvasNodes || !Array.isArray(canvasNodes)) {
      const fallbackUrl = screenshotUrl;
      if (!fallbackUrl) {
        return NextResponse.json(
          { error: "Missing screen coordinates layout or screenshot URL." },
          { status: 400 }
        );
      }
      const isDesktop = isDesktopFrame(deviceFrame);
      const defaultW = isDesktop ? 480 : 172;
      const defaultH = deviceFrame === "MacBook Pro" ? 320 : isDesktop ? 310 : 364;

      canvasNodes = [
        {
          id: "node-legacy",
          x: Math.round((1200 - defaultW) / 2),
          y: Math.round((675 - defaultH) / 2),
          width: defaultW,
          height: defaultH,
          screenshotUrl: fallbackUrl,
          deviceFrame: deviceFrame || "iPhone 15 Pro",
          frameColor: "Dark",
          tilt: tilt || "Flat",
        }
      ];
    }

    // Check for unrendered live Figma embed nodes
    const hasUnrenderedEmbed = canvasNodes.some((n: any) => Boolean(n.isEmbed) && !n.screenshotUrl);
    if (hasUnrenderedEmbed) {
      return NextResponse.json(
        { error: "Cannot export canvas containing live Figma embeds without static screenshots. Please sync frames as images first." },
        { status: 400 }
      );
    }

    // Ensure at least one valid screenshot is present on the canvas
    const hasValidScreenshot = canvasNodes.some((n: any) => Boolean(n.screenshotUrl));
    if (!hasValidScreenshot) {
      return NextResponse.json(
        { error: "Cannot export an empty canvas. Please add at least one screenshot asset before exporting." },
        { status: 400 }
      );
    }

    // 2.5 Enforce maximum screens allowed per mockup based on plan
    const maxAllowedScreens = (effectivePlan === "pro" || user.role === "admin") ? 7 : 3;
    if (canvasNodes.length > maxAllowedScreens) {
      return NextResponse.json(
        { 
          error: `Screen limit exceeded: Your ${effectivePlan} plan allows up to ${maxAllowedScreens} screens per mockup. Upgrade to Pro for up to 7 screens.` 
        },
        { status: 403 }
      );
    }

    // 3. Enforce monthly export quota (Free: 5 exports/mo, Starter: 30 exports/mo, Pro: Unlimited)
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

    const monthMockups = await db
      .select()
      .from(mockups)
      .where(
        and(
          eq(mockups.userId, user.id),
          gte(mockups.createdAt, startOfMonth)
        )
      );

    // Use maximum of permanent export logs and current month mockups (prevents delete trick)
    const currentMonthUsage = Math.max(monthExportLogs.length, monthMockups.length);
    const exportLimit = effectivePlan === "free" ? 5 : effectivePlan === "starter" ? 30 : Infinity;

    if (user.role !== "admin" && currentMonthUsage >= exportLimit) {
      return NextResponse.json(
        { error: `Export limit reached: You have used ${currentMonthUsage}/${exportLimit} monthly exports on your ${effectivePlan} plan. Upgrade to unlock more exports.` },
        { status: 403 }
      );
    }

    // Read local Muckly logo for watermarking overlay
    let logoBase64 = "";
    try {
      const fs = require("fs");
      const path = require("path");
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (e) {
      console.error("Failed to read logo.png for watermarking:", e);
    }

    // 4. Read local font buffers and fetch screenshot images concurrently
    const fontRegularPromise = fs.readFile(
      path.join(process.cwd(), "public", "fonts", "inter-latin-400-normal.woff")
    );
    const fontBoldPromise = fs.readFile(
      path.join(process.cwd(), "public", "fonts", "inter-latin-700-normal.woff")
    );

    // Fetch and base64-encode all node images concurrently
    const nodesPromises = canvasNodes.map(async (node: any) => {
      try {
        if (!node.screenshotUrl) {
          return { ...node, base64: null };
        }
        if (typeof node.screenshotUrl === "string" && node.screenshotUrl.startsWith("/")) {
          const localFilePath = path.join(process.cwd(), "public", node.screenshotUrl);
          try {
            const fileBuf = await fs.readFile(localFilePath);
            const isJpg = node.screenshotUrl.endsWith(".jpg") || node.screenshotUrl.endsWith(".jpeg");
            const base64 = `data:${isJpg ? "image/jpeg" : "image/png"};base64,${fileBuf.toString("base64")}`;
            return { ...node, base64 };
          } catch (err) {
            console.error(`Failed to read local file: ${localFilePath}`, err);
          }
        }
        const imgRes = await fetch(node.screenshotUrl);
        if (!imgRes.ok) {
          console.error(`Failed to fetch node screenshot from CDN: ${node.screenshotUrl}`);
          return { ...node, base64: null };
        }
        const imgArrayBuffer = await imgRes.arrayBuffer();
        const base64 = `data:${imgRes.headers.get("content-type") || "image/png"};base64,${Buffer.from(
          imgArrayBuffer
        ).toString("base64")}`;
        return { ...node, base64 };
      } catch (e) {
        console.error("Error fetching screenshot for node:", e);
        return { ...node, base64: null };
      }
    });

    const [fontRegularBuffer, fontBoldBuffer, fetchedNodes] = await Promise.all([
      fontRegularPromise,
      fontBoldPromise,
      Promise.all(nodesPromises),
    ]);

    function isLightColor(hex: string) {
      if (!hex) return false;
      const cleaned = hex.replace("#", "");
      if (cleaned.length === 3) {
        const r = parseInt(cleaned[0] + cleaned[0], 16);
        const g = parseInt(cleaned[1] + cleaned[1], 16);
        const b = parseInt(cleaned[2] + cleaned[2], 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
      }
      if (cleaned.length === 6) {
        const r = parseInt(cleaned.substring(0, 2), 16);
        const g = parseInt(cleaned.substring(2, 4), 16);
        const b = parseInt(cleaned.substring(4, 6), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
      }
      return false;
    }

    // 5. Setup rendering properties based on specifications
    const bgStyleValue =
      customBgColor ||
      BACKEND_BG_STYLES[background as keyof typeof BACKEND_BG_STYLES] || 
      BACKEND_BG_STYLES.sunset;

    let paddingValue = 48; // Default Standard
    if (paddingLevel === "Compact") paddingValue = 24;
    else if (paddingLevel === "Spacious") paddingValue = 80;

    // Calculate dynamic bounding box of all active mockup nodes
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of fetchedNodes) {
      const isDesktop = isDesktopFrame(node.deviceFrame);
      const defaultW = isDesktop ? 480 : 172;
      const defaultH = node.deviceFrame === "MacBook Pro" ? 320 : isDesktop ? 310 : 364;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const w = node.width ?? defaultW; // Custom resized device width
      const h = node.height ?? defaultH; // Custom resized device height

      if (x < minX) minX = x;
      if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y;
      if (y + h > maxY) maxY = y + h;
    }

    // Fallback if no nodes present
    if (minX === Infinity) minX = 0;
    if (maxX === -Infinity) maxX = 1200;
    if (minY === Infinity) minY = 0;
    if (maxY === -Infinity) maxY = 675;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Account for text overlay space requirements
    let textSpace = 0;
    if (textOverlay || textAccent) {
      textSpace = (textFontSize || 32) * (textAccent ? 2.5 : 1.5) + 32;
    }

    const paddingTop = paddingValue + ((textOverlay || textAccent) && textPosition === "Top" ? textSpace : 0);
    const paddingBottom = paddingValue + ((textOverlay || textAccent) && textPosition === "Bottom" ? textSpace : 0);
    const paddingLeft = paddingValue;
    const paddingRight = paddingValue;

    const exportWidth = Math.round(contentWidth + paddingLeft + paddingRight);
    const exportHeight = Math.round(contentHeight + paddingTop + paddingBottom);

    const isBgLight = background === "white" || background === "candy" || background === "minimal-frost" || isLightColor(customBgColor);

    console.log("[Export Server Debug] exportWidth:", exportWidth, "exportHeight:", exportHeight);
    console.log("[Export Server Debug] fetchedNodes count:", fetchedNodes.length);
    console.log("[Export Server Debug] background:", background, "bgStyleValue:", bgStyleValue?.substring(0, 60));
    console.log("[Export Server Debug] First node:", JSON.stringify({
      x: fetchedNodes[0]?.x,
      y: fetchedNodes[0]?.y,
      screenshotUrl: fetchedNodes[0]?.screenshotUrl?.substring(0, 60),
      deviceFrame: fetchedNodes[0]?.deviceFrame,
      hasBase64: !!fetchedNodes[0]?.base64,
    }));

    // 6. Compile SVG string utilizing Satori
    const svg = await satori(
      <div
        style={{
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
          display: "flex",
          background: bgStyleValue,
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Presentational grid layer overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.08,
          }}
        >
          {Array.from({ length: Math.ceil((exportWidth * exportHeight) / 6400) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "80px",
                height: "80px",
                borderRight: "1px solid #ffffff",
                borderBottom: "1px solid #ffffff",
              }}
            />
          ))}
        </div>

        {/* Global Typography Headline Overlay */}
        {(textOverlay || textAccent) && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: textPosition === "Top" ? `${paddingValue}px` : "auto",
              bottom: textPosition === "Bottom" ? `${paddingValue}px` : "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 40,
            }}
          >
            {textAccent && (
              <span
                style={{
                  fontSize: textFontSize ? `${Math.round(textFontSize * 0.9)}px` : "30px",
                  fontWeight: 800,
                  color: textAccentColor || "#f97316",
                  letterSpacing: "-0.5px",
                  marginBottom: "4px",
                  textAlign: "center",
                }}
              >
                {textAccent}
              </span>
            )}
            {textOverlay && (
              <span
                style={{
                  fontSize: textFontSize ? `${textFontSize}px` : "32px",
                  fontWeight: textWeight === "normal" ? 400 : textWeight === "medium" ? 500 : textWeight === "bold" ? 700 : 800,
                  color: textColor || (isBgLight ? "#000000" : "#ffffff"),
                  textShadow: isBgLight ? "none" : "0 2px 10px rgba(0, 0, 0, 0.2)",
                  letterSpacing: "-0.5px",
                  textAlign: "center",
                }}
              >
                {textOverlay}
              </span>
            )}
          </div>
        )}

        {/* Render each absolute coordinate mockup node (sorted so that the active/selected node is drawn on top) */}
        {fetchedNodes
          .sort((a: any, b: any) => {
            const zA = a.zIndex ?? 0;
            const zB = b.zIndex ?? 0;
            if (zA !== zB) return zA - zB;
            return (a.selected ? 1 : 0) - (b.selected ? 1 : 0);
          })
          .map((node: any) => {
            const shiftedX = (node.x ?? 0) - minX + paddingLeft;
            const shiftedY = (node.y ?? 0) - minY + paddingTop;

            let outerBezelBorder = "#1e2029";
            let middleBezelBg = "#0b0c10";
            let lightChamferVal = "inset 0px 1px 1px rgba(255,255,255,0.15)";
            
            if (node.frameColor === "Light") {
              outerBezelBorder = "#94a3b8";
              middleBezelBg = "#e2e8f0";
              lightChamferVal = "inset 0px 1px 1px rgba(255,255,255,0.45)";
            } else if (node.frameColor === "Gold") {
              outerBezelBorder = "#b5942b";
              middleBezelBg = "#f1e4c3";
              lightChamferVal = "inset 0px 1px 1px rgba(255,255,255,0.35)";
            } else if (node.frameColor === "Space Black") {
              outerBezelBorder = "#090a0f";
              middleBezelBg = "#18191f";
              lightChamferVal = "inset 0px 1px 1px rgba(255,255,255,0.1)";
            } else if (node.frameColor === "Rose Gold") {
              outerBezelBorder = "#dfa295";
              middleBezelBg = "#f6e5e1";
              lightChamferVal = "inset 0px 1px 1px rgba(255,255,255,0.3)";
            }

            const buttonsColor =
              node.frameColor === "Light" ? "#cbd5e1" :
              node.frameColor === "Gold" ? "#d4af37" :
              node.frameColor === "Space Black" ? "#0d0d11" :
              node.frameColor === "Rose Gold" ? "#f3d1c9" : "#1e1e24";

            // Satori 2D Skew Transformations matching Client perspective tilts
            let satoriTransform = "scale(0.92)";
            if (node.tilt === "Left Tilt") {
              satoriTransform = "rotate(-8deg) translateX(-15px) translateY(-5px) scale(0.85)";
            } else if (node.tilt === "Right Tilt") {
              satoriTransform = "rotate(8deg) translateX(15px) translateY(-5px) scale(0.85)";
            } else if (node.tilt === "Floating") {
              satoriTransform = "translateY(-20px) scale(0.88)";
            }

            // Combined drop shadow with light catch chamfer
            let shadowStyle = isBgLight ? "0px 20px 35px rgba(0, 0, 0, 0.16)" : "0px 20px 30px rgba(0, 0, 0, 0.35)";
            if (shadowIntensity === "None") shadowStyle = "";
            else if (shadowIntensity === "Soft") shadowStyle = isBgLight ? "0px 15px 35px rgba(0, 0, 0, 0.12)" : "0px 15px 35px rgba(0, 0, 0, 0.25)";
            else if (shadowIntensity === "Dramatic") shadowStyle = isBgLight ? "0px 30px 60px rgba(0, 0, 0, 0.24)" : "0px 30px 60px rgba(0, 0, 0, 0.55)";

            // Combine the inset light chamfer and the outer drop shadow in Satori
            const combinedBoxShadow = shadowStyle 
              ? `${lightChamferVal}, ${shadowStyle}` 
              : lightChamferVal;

            const renderDeviceFeature = () => {
              if (node.showIsland === false) return null;
              if (
                node.deviceFrame === "iPhone 17 Pro" ||
                node.deviceFrame === "iPhone 16 Pro" ||
                node.deviceFrame === "iPhone 15 Pro"
              ) {
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "30%",
                      maxWidth: "124px",
                      minWidth: "70px",
                      height: "14px",
                      backgroundColor: "#090a0f",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                      zIndex: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Camera Lens Reflection */}
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        position: "absolute",
                        right: "25%",
                        background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                        opacity: 0.85,
                      }}
                    />
                    {/* Sensor Dot */}
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        position: "absolute",
                        left: "30%",
                        backgroundColor: "#1e2030",
                        opacity: 0.4,
                      }}
                    />
                  </div>
                );
              }
              if (
                node.deviceFrame === "iPhone 14" ||
                node.deviceFrame === "iPhone 13"
              ) {
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "0px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "52%",
                      height: "18px",
                      backgroundColor: "#090a0f",
                      borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      borderBottomLeftRadius: "10px",
                      borderBottomRightRadius: "10px",
                      zIndex: 30,
                    }}
                  />
                );
              }
              if (node.deviceFrame === "Google Pixel 9 Pro") {
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "11px",
                      height: "11px",
                      backgroundColor: "#090a0f",
                      borderRadius: "50%",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      zIndex: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                        opacity: 0.85,
                      }}
                    />
                  </div>
                );
              }
              if (node.deviceFrame === "Samsung Galaxy S24") {
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "7px",
                      height: "7px",
                      backgroundColor: "#000000",
                      borderRadius: "50%",
                      zIndex: 30,
                    }}
                  />
                );
              }
              if (node.deviceFrame === "Sony Xperia 1 VI") {
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#000000",
                      borderRadius: "50%",
                      zIndex: 30,
                    }}
                  />
                );
              }
              return null;
            };

            const isDesktop = isDesktopFrame(node.deviceFrame);
            const defaultW = isDesktop ? 480 : 172;
            const defaultH = node.deviceFrame === "MacBook Pro" ? 320 : isDesktop ? 310 : 364;
            const nodeWidth = node.width ?? defaultW;
            const nodeHeight = node.height ?? defaultH;

            // 1. Safari macOS Browser in Satori
            if (node.deviceFrame === "Safari Browser") {
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `${shiftedX}px`,
                    top: `${shiftedY}px`,
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                    display: "flex",
                    flexDirection: "column",
                    transform: satoriTransform,
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    backgroundColor: "#161822",
                    overflow: "hidden",
                    boxShadow: shadowStyle,
                    zIndex: 10,
                  }}
                >
                  {/* Safari Window Header Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "32px",
                      backgroundColor: "#1f2230",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "60px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ff5f56", border: "1px solid #e0443e" }} />
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ffbd2e", border: "1px solid #dea123" }} />
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#27c93f", border: "1px solid #1aab29" }} />
                    </div>
                    {/* Address pill */}
                    <div
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "6px",
                        height: "20px",
                        padding: "0 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>mockly.app</span>
                    </div>
                    <div style={{ width: "60px" }} />
                  </div>

                  {/* Screen viewport */}
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      display: "flex",
                      position: "relative",
                      backgroundColor: "#0c0d12",
                      overflow: "hidden",
                    }}
                  >
                    {node.base64 ? (
                      <img
                        src={node.base64}
                        alt="Screenshot"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: (node.screenFit as any) || "cover",
                          position: "absolute",
                          zIndex: 10,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#0c0d12",
                          position: "absolute",
                          zIndex: 10,
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}>NO ASSET</span>
                      </div>
                    )}
                    {/* Premium Glare Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 65%)",
                        zIndex: 20,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              );
            }

            // 2. Google Chrome Window in Satori
            if (node.deviceFrame === "Chrome Browser") {
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `${shiftedX}px`,
                    top: `${shiftedY}px`,
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                    display: "flex",
                    flexDirection: "column",
                    transform: satoriTransform,
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    backgroundColor: "#1e1f26",
                    overflow: "hidden",
                    boxShadow: shadowStyle,
                    zIndex: 10,
                  }}
                >
                  {/* Chrome Tab Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "28px",
                      backgroundColor: "#16171d",
                      padding: "0 10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ff5f56", border: "1px solid #e0443e" }} />
                      <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ffbd2e", border: "1px solid #dea123" }} />
                      <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#27c93f", border: "1px solid #1aab29" }} />
                    </div>
                    {/* Active tab */}
                    <div
                      style={{
                        marginLeft: "12px",
                        backgroundColor: "#1e1f26",
                        borderTopLeftRadius: "6px",
                        borderTopRightRadius: "6px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "3px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#6366f1" }} />
                      <span style={{ fontSize: "9px", color: "#ffffff", fontWeight: 500 }}>Mockly App</span>
                    </div>
                  </div>

                  {/* Chrome Omnibox Sub-bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "26px",
                      backgroundColor: "#1e1f26",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "0 10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "18px",
                        backgroundColor: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "9px",
                        padding: "0 10px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>https://mockly.app</span>
                    </div>
                  </div>

                  {/* Screen viewport */}
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      display: "flex",
                      position: "relative",
                      backgroundColor: "#0c0d12",
                      overflow: "hidden",
                    }}
                  >
                    {node.base64 ? (
                      <img
                        src={node.base64}
                        alt="Screenshot"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: (node.screenFit as any) || "cover",
                          position: "absolute",
                          zIndex: 10,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#0c0d12",
                          position: "absolute",
                          zIndex: 10,
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}>NO ASSET</span>
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 65%)",
                        zIndex: 20,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              );
            }

            // 3. MacBook Pro 16" in Satori
            if (node.deviceFrame === "MacBook Pro") {
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `${shiftedX}px`,
                    top: `${shiftedY}px`,
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transform: satoriTransform,
                    zIndex: 10,
                  }}
                >
                  {/* MacBook Display Lid */}
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      borderTopLeftRadius: "14px",
                      borderTopRightRadius: "14px",
                      borderBottomLeftRadius: "4px",
                      borderBottomRightRadius: "4px",
                      border: `6px solid ${outerBezelBorder}`,
                      backgroundColor: middleBezelBg,
                      display: "flex",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: shadowStyle,
                    }}
                  >
                    {/* Notch Camera */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "36px",
                        height: "9px",
                        backgroundColor: "#000000",
                        borderBottomLeftRadius: "5px",
                        borderBottomRightRadius: "5px",
                        zIndex: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          backgroundColor: "#1e3a8a",
                        }}
                      />
                    </div>

                    {/* Screen Viewport */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "3px",
                        backgroundColor: "#0c0d12",
                        display: "flex",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {node.base64 ? (
                        <img
                          src={node.base64}
                          alt="Screenshot"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: (node.screenFit as any) || "cover",
                            position: "absolute",
                            zIndex: 10,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#0c0d12",
                            position: "absolute",
                            zIndex: 10,
                          }}
                        >
                          <span style={{ fontSize: "10px", fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}>NO ASSET</span>
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 65%)",
                          zIndex: 20,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>

                  {/* MacBook Aluminum Lower Lip */}
                  <div
                    style={{
                      width: "104%",
                      height: "12px",
                      borderBottomLeftRadius: "8px",
                      borderBottomRightRadius: "8px",
                      backgroundColor: buttonsColor,
                      display: "flex",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "52px",
                        height: "3.5px",
                        backgroundColor: "#090a0f",
                        borderBottomLeftRadius: "2px",
                        borderBottomRightRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              );
            }

            // 4. Smartphone Frames in Satori (Default)
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: `${shiftedX}px`,
                  top: `${shiftedY}px`,
                  width: `${nodeWidth}px`,
                  height: `${nodeHeight}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: satoriTransform,
                  borderRadius: "38px",
                  zIndex: 10,
                }}
              >
                {/* Outer Titanium Layer (Double bezel rim) */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "38px",
                    border: `8px solid ${outerBezelBorder}`,
                    backgroundColor: middleBezelBg,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: combinedBoxShadow,
                  }}
                >
                  {/* Physical side buttons with metal reflections */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-10px",
                      top: "70px",
                      width: "3px",
                      height: "22px",
                      backgroundColor: buttonsColor,
                      borderTopLeftRadius: "2px",
                      borderBottomLeftRadius: "2px",
                      boxShadow: "inset 0px 1px 1px rgba(255,255,255,0.3)",
                      borderTop: "1px solid rgba(255,255,255,0.15)",
                      borderBottom: "1px solid rgba(0,0,0,0.3)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "-10px",
                      top: "98px",
                      width: "3px",
                      height: "22px",
                      backgroundColor: buttonsColor,
                      borderTopLeftRadius: "2px",
                      borderBottomLeftRadius: "2px",
                      boxShadow: "inset 0px 1px 1px rgba(255,255,255,0.3)",
                      borderTop: "1px solid rgba(255,255,255,0.15)",
                      borderBottom: "1px solid rgba(0,0,0,0.3)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "-10px",
                      top: "84px",
                      width: "3px",
                      height: "36px",
                      backgroundColor: buttonsColor,
                      borderTopRightRadius: "2px",
                      borderBottomRightRadius: "2px",
                      boxShadow: "inset 0px 1px 1px rgba(255,255,255,0.3)",
                      borderTop: "1px solid rgba(255,255,255,0.15)",
                      borderBottom: "1px solid rgba(0,0,0,0.3)",
                    }}
                  />

                  {renderDeviceFeature()}

                  {/* Inner Glass Bezel & Screen Wrapper */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "29px",
                      backgroundColor: "#000000",
                      padding: "3.5px",
                      display: "flex",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "25px",
                        display: "flex",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#0c0d12",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {node.base64 ? (
                        <img
                          src={node.base64}
                          alt="Screenshot Frame"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: (node.screenFit as any) || "cover",
                            position: "absolute",
                            zIndex: 10,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#0c0d12",
                            padding: "16px",
                            position: "absolute",
                            zIndex: 10,
                          }}
                        >
                          <span style={{ fontSize: "8px", fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}>NO ASSET</span>
                        </div>
                      )}

                      {/* Premium Dynamic Glass Glare Overlay */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0) 65%)",
                          zIndex: 20,
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        
        {/* Server Side Watermark for Free Plan users (exempting Admins) */}
        {effectivePlan === "free" && user.role !== "admin" && (
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(15, 23, 42, 0.45)",
            }}
          >
            {logoBase64 && (
              <img
                src={logoBase64}
                alt="Muckly Logo"
                style={{
                  width: "18px",
                  height: "18px",
                  marginRight: "8px",
                  borderRadius: "5px",
                  objectFit: "cover",
                }}
              />
            )}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "1.2px",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              Muckly
            </span>
          </div>
        )}
      </div>,
      {
        width: exportWidth,
        height: exportHeight,
        fonts: [
          {
            name: "Inter",
            data: fontRegularBuffer,
            weight: 400,
            style: "normal",
          },
          {
            name: "Inter",
            data: fontBoldBuffer,
            weight: 700,
            style: "normal",
          },
        ],
      }
    );

    // 7. Convert vector SVG to ultra-crisp high-DPI retina PNG with Sharp (3x density scale)
    const scaleMultiplier = 3;
    const pngBuffer = await sharp(Buffer.from(svg), {
      density: 72 * scaleMultiplier,
    })
      .png()
      .toBuffer();

    // 8. Upload exported file to secure ImageKit mockup folder
    const uploadRes = await imagekit.upload({
      file: pngBuffer,
      fileName: `mockup-${user.id}-${Date.now()}.png`,
      folder: `/mockly/mockups/${user.id}`,
    });

    // 9. Persist mockup data to database (saving first screen node parameters as fallback)
    const primaryNode = fetchedNodes[0] || {};
    const newMockupId = crypto.randomUUID();
    const [insertedMockup] = await db
      .insert(mockups)
      .values({
        id: newMockupId,
        userId: user.id,
        title: title || "App Showcase Mockup",
        screenshotUrl: primaryNode.screenshotUrl || null,
        mockupUrl: uploadRes.url,
        deviceFrame: primaryNode.deviceFrame || "iPhone 15 Pro",
        background: background || "sunset",
        tilt: primaryNode.tilt || "Flat",
        createdAt: new Date(),
      })
      .returning();

    // 9.5 Record permanent export event for quota enforcement (tamper-proof against mockup deletion)
    await db.insert(exportLogs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date(),
    });

    // 10. Return completed record
    return NextResponse.json({
      success: true,
      mockup: insertedMockup,
    });
  } catch (error: any) {
    console.error("Error in mockup /api/mockups/export:", error);
    console.error("Stack trace:", error?.stack);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
