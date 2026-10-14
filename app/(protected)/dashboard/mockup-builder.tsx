"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  Background,
  BackgroundVariant,
  Node,
  ReactFlowProvider,
  NodeResizer,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Background Preset Definitions
export const BACKGROUND_PRESETS = [
  { id: "minimal-frost", name: "App Store Studio", style: "radial-gradient(ellipse at 50% 120%, rgba(186, 230, 253, 0.5) 0%, rgba(240, 249, 255, 0.3) 45%, #ffffff 80%)" },
  { id: "sunset", name: "Sunset Glow", style: "linear-gradient(135deg, #ff5e62 0%, #ff9966 100%)" },
  { id: "ocean", name: "Ocean Breeze", style: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" },
  { id: "lavender", name: "Midnight Lavender", style: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "emerald", name: "Emerald Aura", style: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "cyberpunk", name: "Cyberpunk Neon", style: "linear-gradient(135deg, #f80759 0%, #bc4e9c 100%)" },
  { id: "aurora", name: "Cosmic Aurora", style: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  
  // Solids
  { id: "slate", name: "Slate Solid", style: "#334155" },
  { id: "rose", name: "Rose Solid", style: "#be123c" },
  { id: "amber", name: "Amber Solid", style: "#b45309" },
  { id: "teal", name: "Teal Solid", style: "#0f766e" },
  { id: "violet", name: "Violet Solid", style: "#6d28d9" },
  { id: "zinc", name: "Zinc Solid", style: "#3f3f46" },
  { id: "white", name: "Pure White", style: "#ffffff" },
  { id: "black", name: "Pure Black", style: "#000000" },

  // Meshes
  { id: "candy", name: "Candy Floss Mesh", style: "radial-gradient(at 10% 20%, rgba(254, 240, 138, 0.4) 0px, transparent 50%), radial-gradient(at 90% 10%, rgba(253, 164, 175, 0.5) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(165, 180, 252, 0.5) 0px, transparent 50%), #ffffff" },
  { id: "nebula", name: "Nebula Dusk Mesh", style: "radial-gradient(at 10% 10%, rgba(79, 70, 229, 0.5) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(219, 39, 119, 0.5) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(59, 130, 246, 0.3) 0px, transparent 50%), #0c0f1d" },
  { id: "retrowave", name: "Retro Wave Mesh", style: "radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.4) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(20, 184, 166, 0.4) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.4) 0px, transparent 50%), #030303" },
  { id: "forest", name: "Forest Sunset Mesh", style: "radial-gradient(at 20% 0%, rgba(251, 146, 60, 0.5) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(16, 185, 129, 0.4) 0px, transparent 50%), #0d1e1a" }
];

export const getBoardDimensions = (aspectRatio?: "16:9" | "9:16" | "1:1") => {
  if (aspectRatio === "9:16") {
    return { width: 675, height: 1200 };
  }
  if (aspectRatio === "1:1") {
    return { width: 1000, height: 1000 };
  }
  return { width: 1200, height: 675 };
};

export const DEVICE_FRAMES = [
  // Desktop & Web
  { id: "MacBook Pro", name: "MacBook Pro 16\"", category: "Desktop" },
  { id: "Safari Browser", name: "Safari macOS Browser", category: "Desktop" },
  { id: "Chrome Browser", name: "Google Chrome Window", category: "Desktop" },

  // Smartphones
  { id: "iPhone 17 Pro", name: "iPhone 17 Pro", category: "Mobile" },
  { id: "iPhone 16 Pro", name: "iPhone 16 Pro", category: "Mobile" },
  { id: "iPhone 15 Pro", name: "iPhone 15 Pro", category: "Mobile" },
  { id: "iPhone 14", name: "iPhone 14", category: "Mobile" },
  { id: "iPhone 13", name: "iPhone 13", category: "Mobile" },
  { id: "Google Pixel 9 Pro", name: "Google Pixel 9 Pro", category: "Mobile" },
  { id: "Samsung Galaxy S24", name: "Samsung Galaxy S24", category: "Mobile" },
  { id: "Sony Xperia 1 VI", name: "Sony Xperia 1 VI", category: "Mobile" },
];

export const isDesktopFrame = (frameId?: string | null) => {
  return frameId === "MacBook Pro" || frameId === "Safari Browser" || frameId === "Chrome Browser";
};

export const getFrameBezels = (deviceFrame?: string | null) => {
  if (deviceFrame === "Safari Browser") return { w: 2, h: 34 };
  if (deviceFrame === "Chrome Browser") return { w: 2, h: 58 };
  if (deviceFrame === "MacBook Pro") return { w: 10, h: 22 };
  return { w: 23, h: 23 }; // mobile frames (8px border * 2 + 3.5px padding * 2 = 23px)
};

export const FRAME_COLORS = [
  { id: "Dark", name: "Titanium Dark", hex: "#1e1e24" },
  { id: "Light", name: "Titanium Silver", hex: "#e2e8f0" },
  { id: "Gold", name: "Titanium Gold", hex: "#d4af37" },
  { id: "Space Black", name: "Space Black", hex: "#0d0d11" },
  { id: "Rose Gold", name: "Rose Gold", hex: "#f3d1c9" },
];

export const ANGLES = [
  { id: "Flat", name: "Flat Layout", desc: "Clean and direct" },
  { id: "Left Tilt", name: "Left 3D Tilt", desc: "Modern perspective" },
  { id: "Right Tilt", name: "Right 3D Tilt", desc: "Dynamic isometric view" },
  { id: "Floating", name: "Floating Depth", desc: "Ambient drop height" },
];

interface MockupRecord {
  id: string;
  title: string;
  screenshotUrl: string | null;
  mockupUrl: string | null;
  deviceFrame: string | null;
  background: string | null;
  tilt: string | null;
  createdAt: string | Date;
}

interface MockupBuilderProps {
  plan: "free" | "starter" | "pro";
  initialUsage: number;
  initialMockups: MockupRecord[];
  userRole?: "admin" | "user";
}

// Screen media renderer supporting Figma live embeds, static screenshots, or interactive empty states
function MockupScreenMedia({
  isEmbed,
  embedUrl,
  screenshotUrl,
  interactive,
  screenFit = "cover",
}: {
  isEmbed?: boolean;
  embedUrl?: string;
  screenshotUrl?: string;
  interactive?: boolean;
  screenFit?: "cover" | "contain" | "fill";
}) {
  if (isEmbed && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title="Figma Live Embed"
        className={`w-full h-full border-0 select-none z-10 bg-[#0c0d12] ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        allowFullScreen
      />
    );
  }
  if (screenshotUrl) {
    const objectFitClass =
      screenFit === "contain"
        ? "object-contain"
        : screenFit === "fill"
        ? "object-fill"
        : "object-cover";
    return (
      <img
        src={screenshotUrl}
        alt="Screenshot Preview"
        className={`w-full h-full ${objectFitClass} select-none pointer-events-none z-10`}
      />
    );
  }
  return (
    <div className="w-full h-full bg-[#0c0d12] flex flex-col items-center justify-center p-4 text-center gap-1.5 z-10">
      <svg className="w-6 h-6 text-text-dim animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 00-1.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">No Asset Uploaded</span>
      <span className="text-[7px] text-text-dim leading-snug">Drag & drop screen in sidebar</span>
    </div>
  );
}

// React Flow Custom Node Renderer Component
function CustomDeviceNode({ id, data, selected }: any) {
  const { updateNodeData } = useReactFlow();
  const activeColor = FRAME_COLORS.find((c) => c.id === data.frameColor) || FRAME_COLORS[0];
  const isDesktop = isDesktopFrame(data.deviceFrame);
  
  let outerBezelBorder = "border-[#1e2029]";
  let middleBezelBg = "bg-[#0b0c10]";
  let lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]";
  
  if (data.frameColor === "Light") {
    outerBezelBorder = "border-[#94a3b8]";
    middleBezelBg = "bg-[#e2e8f0]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]";
  } else if (data.frameColor === "Gold") {
    outerBezelBorder = "border-[#b5942b]";
    middleBezelBg = "bg-[#f1e4c3]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]";
  } else if (data.frameColor === "Space Black") {
    outerBezelBorder = "border-[#090a0f]";
    middleBezelBg = "bg-[#18191f]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]";
  } else if (data.frameColor === "Rose Gold") {
    outerBezelBorder = "border-[#dfa295]";
    middleBezelBg = "bg-[#f6e5e1]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]";
  }

  const buttonsColor = activeColor.hex;
  let transform3DStyle = "";
  let shadowStyle = "";

  const intensity = data.shadowIntensity || "Soft";

  switch (data.tilt) {
    case "Left Tilt":
      transform3DStyle = "perspective(1200px) rotateY(-20deg) rotateX(8deg) rotateZ(3deg) scale(0.85)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(-16px 20px 25px rgba(0, 0, 0, 0.35))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(-28px 36px 48px rgba(0, 0, 0, 0.6)) drop-shadow(-4px 8px 16px rgba(0, 0, 0, 0.3))";
      }
      break;
    case "Right Tilt":
      transform3DStyle = "perspective(1200px) rotateY(20deg) rotateX(8deg) rotateZ(-3deg) scale(0.85)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(16px 20px 25px rgba(0, 0, 0, 0.35))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(28px 36px 48px rgba(0, 0, 0, 0.6)) drop-shadow(4px 8px 16px rgba(0, 0, 0, 0.3))";
      }
      break;
    case "Floating":
      transform3DStyle = "perspective(1200px) rotateX(12deg) translateY(-12px) scale(0.88)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(0 20px 30px rgba(0, 0, 0, 0.35))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(0 40px 60px rgba(0, 0, 0, 0.65)) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))";
      }
      break;
    case "Flat":
    default:
      transform3DStyle = "perspective(1200px) scale(0.92)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.25))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(0 30px 45px rgba(0, 0, 0, 0.55)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))";
      }
      break;
  }

  const renderFrameBody = () => {
    // 1. Safari Browser Window
    if (data.deviceFrame === "Safari Browser") {
      return (
        <div className={`w-full h-full rounded-2xl border border-white/10 bg-[#161822] flex flex-col overflow-hidden relative ${shadowStyle}`}>
          {/* Safari Top Window Bar */}
          <div className="w-full h-8 bg-[#1f2230] border-b border-white/10 px-3 flex items-center justify-between z-30 select-none">
            {/* macOS Traffic Lights */}
            <div className="flex items-center gap-1.5 w-16">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            {/* Address bar pill */}
            <div className="flex-1 max-w-[240px] mx-auto h-5 bg-black/30 border border-white/10 rounded-md px-2.5 flex items-center justify-center gap-1 text-[9px] text-text-dim">
              <svg className="w-2.5 h-2.5 text-text-dim/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="truncate font-medium">mockly.app</span>
            </div>
            {/* Safari header icons */}
            <div className="flex items-center justify-end gap-2 w-16 text-text-dim/60">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          </div>

          {/* Viewport Screen Content */}
          <div className="flex-1 relative w-full h-[calc(100%-32px)] bg-[#0c0d12] flex items-center justify-center overflow-hidden">
            <MockupScreenMedia
              isEmbed={data.isEmbed}
              embedUrl={data.embedUrl}
              screenshotUrl={data.screenshotUrl}
              interactive={data.interactive}
              screenFit={data.screenFit}
            />
            {!data.interactive && (
              <div 
                className="absolute inset-0 pointer-events-none z-20 opacity-80"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 65%)"
                }}
              />
            )}
          </div>
        </div>
      );
    }

    // 2. Google Chrome Window
    if (data.deviceFrame === "Chrome Browser") {
      return (
        <div className={`w-full h-full rounded-2xl border border-white/10 bg-[#1e1f26] flex flex-col overflow-hidden relative ${shadowStyle}`}>
          {/* Chrome Tab Bar */}
          <div className="w-full h-7 bg-[#16171d] px-2.5 flex items-center gap-2 z-30 select-none">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <div className="h-6 px-3 bg-[#1e1f26] rounded-t-lg flex items-center gap-1.5 text-[9px] text-foreground-pure border-t border-x border-white/10 max-w-[130px]">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="truncate font-medium">Mockly</span>
              <span className="text-[10px] text-text-dim hover:text-white ml-auto cursor-default">×</span>
            </div>
            <span className="text-text-dim text-xs font-light hover:text-white px-1 cursor-default">+</span>
          </div>

          {/* Chrome Omnibox Bar */}
          <div className="w-full h-7 bg-[#1e1f26] border-b border-white/10 px-2.5 flex items-center gap-2 z-30">
            <div className="flex items-center gap-1 text-text-dim">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <svg className="w-2.5 h-2.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div className="flex-1 h-5 bg-black/40 border border-white/5 rounded-full px-2.5 flex items-center gap-1 text-[9px] text-text-dim">
              <svg className="w-2.5 h-2.5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="truncate font-medium text-text-muted">https://mockly.app</span>
            </div>
          </div>

          {/* Viewport Screen Content */}
          <div className="flex-1 relative w-full h-[calc(100%-56px)] bg-[#0c0d12] flex items-center justify-center overflow-hidden">
            <MockupScreenMedia
              isEmbed={data.isEmbed}
              embedUrl={data.embedUrl}
              screenshotUrl={data.screenshotUrl}
              interactive={data.interactive}
              screenFit={data.screenFit}
            />
            {!data.interactive && (
              <div 
                className="absolute inset-0 pointer-events-none z-20 opacity-80"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 65%)"
                }}
              />
            )}
          </div>
        </div>
      );
    }

    // 3. MacBook Pro 16"
    if (data.deviceFrame === "MacBook Pro") {
      return (
        <div className={`w-full h-full flex flex-col items-center select-none relative ${shadowStyle}`}>
          {/* MacBook Display Lid */}
          <div 
            className={`w-full flex-1 rounded-t-[14px] rounded-b-[4px] border-[5px] bg-[#0c0d12] flex flex-col overflow-hidden relative ${outerBezelBorder} ${middleBezelBg} ${lightChamferClass}`}
          >
            {/* Top Display Notch Camera */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[34px] h-[9px] bg-[#000000] rounded-b-[5px] z-30 flex items-center justify-center">
              <span 
                className="w-1.5 h-1.5 rounded-full shadow-inner flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                  opacity: 0.9
                }}
              >
                <span className="w-0.5 h-0.5 rounded-full bg-white/50 absolute top-0.5 left-0.5" />
              </span>
            </div>

            {/* Screen Content */}
            <div className="w-full h-full relative rounded-[3px] overflow-hidden bg-[#0c0d12] flex items-center justify-center">
              <MockupScreenMedia
                isEmbed={data.isEmbed}
                embedUrl={data.embedUrl}
                screenshotUrl={data.screenshotUrl}
                interactive={data.interactive}
                screenFit={data.screenFit}
              />
              {!data.interactive && (
                <div 
                  className="absolute inset-0 pointer-events-none z-20 opacity-80"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 65%)"
                  }}
                />
              )}
            </div>
          </div>

          {/* MacBook Pro Aluminum Lower Lip */}
          <div 
            className="w-[104%] -mx-[2%] h-[12px] rounded-b-[8px] flex items-start justify-center relative shadow-sm border-t border-black/40"
            style={{
              backgroundColor: activeColor.hex,
              backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(0,0,0,0.2))",
            }}
          >
            <div className="w-[52px] h-[3.5px] bg-[#090a0f] rounded-b-sm mx-auto shadow-inner" />
          </div>
        </div>
      );
    }

    // 4. Mobile Frames (iPhone 17 Pro, iPhone 16 Pro, iPhone 15 Pro, iPhone 14/13, Pixel, Galaxy, Xperia)
    return (
      <div 
        className={`w-full h-full rounded-[38px] border-[8px] bg-[#0c0d12] flex flex-col overflow-hidden relative ${outerBezelBorder} ${middleBezelBg} ${lightChamferClass} ${shadowStyle}`}
      >
        {/* Physical side buttons with metal reflections */}
        <div 
          className="absolute -left-[10px] top-[70px] w-[3px] h-[22px] rounded-l-sm z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border-y border-black/30" 
          style={{ backgroundColor: buttonsColor }} 
        />
        <div 
          className="absolute -left-[10px] top-[98px] w-[3px] h-[22px] rounded-l-sm z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border-y border-black/30" 
          style={{ backgroundColor: buttonsColor }} 
        />
        <div 
          className="absolute -right-[10px] top-[84px] w-[3px] h-[36px] rounded-r-sm z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border-y border-black/30" 
          style={{ backgroundColor: buttonsColor }} 
        />

        {/* Notch dynamic layouts with glass lens reflections */}
        {(data.showIsland !== false) && (data.deviceFrame === "iPhone 17 Pro" || data.deviceFrame === "iPhone 16 Pro" || data.deviceFrame === "iPhone 15 Pro") && (
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[30%] max-w-[124px] min-w-[70px] h-[14px] bg-[#090a0f] border border-white/5 rounded-full z-30 flex items-center justify-center">
            {/* Camera Lens Reflection */}
            <span 
              className="w-1.5 h-1.5 rounded-full absolute right-[25%] shadow-inner flex items-center justify-center" 
              style={{
                background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                opacity: 0.85
              }}
            >
              <span className="w-0.5 h-0.5 rounded-full bg-white/40 absolute top-0.5 left-0.5" />
            </span>
            {/* Sensor Dot */}
            <span className="w-1 h-1 rounded-full bg-[#1e2030] absolute left-[30%] opacity-40" />
          </div>
        )}

        {(data.showIsland !== false) && (data.deviceFrame === "iPhone 14" || data.deviceFrame === "iPhone 13") && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[52%] h-[18px] bg-[#090a0f] border-x border-b border-white/5 rounded-b-[10px] z-30 flex items-center justify-center">
            <span className="w-[45%] h-[2px] bg-[#222] rounded-full absolute top-[3px]" />
          </div>
        )}

        {(data.showIsland !== false) && data.deviceFrame === "Google Pixel 9 Pro" && (
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[11px] h-[11px] bg-[#090a0f] rounded-full z-30 border border-white/5 flex items-center justify-center">
            <span 
              className="w-1.5 h-1.5 rounded-full shadow-inner flex items-center justify-center"
              style={{
                background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                opacity: 0.85
              }}
            >
              <span className="w-0.5 h-0.5 rounded-full bg-white/40 absolute top-0.5 left-0.5" />
            </span>
          </div>
        )}

        {(data.showIsland !== false) && data.deviceFrame === "Samsung Galaxy S24" && (
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] bg-[#000] rounded-full z-30 border border-white/5 flex items-center justify-center" />
        )}

        {(data.showIsland !== false) && data.deviceFrame === "Sony Xperia 1 VI" && (
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-[#000] rounded-full z-30 border border-white/5 flex items-center justify-center" />
        )}

        {/* 1px inset ring */}
        <div className="absolute inset-0 rounded-[28px] border border-white/5 pointer-events-none z-20" />

        {/* Inner Glass Bezel & Screen Wrapper */}
        <div className="w-full h-full rounded-[29px] bg-black p-[3.5px] overflow-hidden flex relative">
          <div className="w-full h-full relative rounded-[25px] overflow-hidden bg-[#0c0d12] flex items-center justify-center">
            <MockupScreenMedia
              isEmbed={data.isEmbed}
              embedUrl={data.embedUrl}
              screenshotUrl={data.screenshotUrl}
              interactive={data.interactive}
              screenFit={data.screenFit}
            />
            {!data.interactive && (
              <div 
                className="absolute inset-0 pointer-events-none z-20 opacity-85"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0) 65%)"
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`relative w-full h-full flex flex-col items-center justify-center select-none ${
        selected ? (isDesktop ? "ring-2 ring-indigo-500 rounded-2xl scale-102 shadow-[0_0_20px_rgba(99,102,241,0.35)]" : "ring-2 ring-indigo-500 rounded-[38px] scale-102 shadow-[0_0_20px_rgba(99,102,241,0.35)]") : ""
      }`}
      style={{ transform: transform3DStyle }}
    >
      <NodeResizer 
        color="#6366f1"
        minWidth={isDesktop ? 220 : 100}
        minHeight={isDesktop ? 140 : 212}
        keepAspectRatio={true}
        isVisible={selected}
        handleStyle={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#ffffff', border: '2px solid #6366f1' }}
        lineStyle={{ border: '1.5px dashed #6366f1' }}
      />
      
      {renderFrameBody()}

      {selected && (
        <div className="absolute -top-3 -right-3 flex gap-1.5 z-50">
          {data.isEmbed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, { interactive: !data.interactive });
              }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold shadow-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                data.interactive 
                  ? "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white" 
                  : "bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white"
              }`}
              title={data.interactive ? "Lock canvas dragging" : "Interact with Figma preview"}
            >
              {data.interactive ? (
                <>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Lock Drag</span>
                </>
              ) : (
                <>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>Interact</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
            className="w-7 h-7 rounded-full bg-rose-600 border border-rose-500/20 text-white flex items-center justify-center shadow-lg active:scale-90 hover:bg-rose-500 transition-all cursor-pointer"
            title="Delete screen"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// High Fidelity Static Device Mockup component for stacked board static previews
function StaticDeviceMockup({ node, shadowIntensity }: { node: any; shadowIntensity: "None" | "Soft" | "Dramatic" }) {
  const data = node.data || {};
  const frameColor = data.frameColor || node.frameColor || "Dark";
  const deviceFrame = data.deviceFrame || node.deviceFrame || "iPhone 17 Pro";
  const tilt = data.tilt || node.tilt || "Flat";
  const screenshotUrl = data.screenshotUrl || node.screenshotUrl;
  const isDesktop = isDesktopFrame(deviceFrame);

  const activeColor = FRAME_COLORS.find((c) => c.id === frameColor) || FRAME_COLORS[0];
  
  let outerBezelBorder = "border-[#1e2029]";
  let middleBezelBg = "bg-[#0b0c10]";
  let lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]";
  
  if (frameColor === "Light") {
    outerBezelBorder = "border-[#94a3b8]";
    middleBezelBg = "bg-[#e2e8f0]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]";
  } else if (frameColor === "Gold") {
    outerBezelBorder = "border-[#b5942b]";
    middleBezelBg = "bg-[#f1e4c3]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]";
  } else if (frameColor === "Space Black") {
    outerBezelBorder = "border-[#090a0f]";
    middleBezelBg = "bg-[#18191f]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]";
  } else if (frameColor === "Rose Gold") {
    outerBezelBorder = "border-[#dfa295]";
    middleBezelBg = "bg-[#f6e5e1]";
    lightChamferClass = "shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]";
  }

  const buttonsColor = activeColor.hex;
  let transform3DStyle = "";
  let shadowStyle = "";

  const intensity = shadowIntensity || "Soft";

  switch (tilt) {
    case "Left Tilt":
      transform3DStyle = "perspective(1200px) rotateY(-20deg) rotateX(8deg) rotateZ(3deg) scale(0.85)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(-16px 20px 25px rgba(0, 0, 0, 0.35))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(-28px 36px 48px rgba(0, 0, 0, 0.6)) drop-shadow(-4px 8px 16px rgba(0, 0, 0, 0.3))";
      }
      break;
    case "Right Tilt":
      transform3DStyle = "perspective(1200px) rotateY(20deg) rotateX(8deg) rotateZ(-3deg) scale(0.85)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(16px 20px 25px rgba(0, 0, 0, 0.35))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(28px 36px 48px rgba(0, 0, 0, 0.6)) drop-shadow(4px 8px 16px rgba(0, 0, 0, 0.3))";
      }
      break;
    case "Floating":
      transform3DStyle = "perspective(1200px) rotateX(12deg) translateY(-12px) scale(0.88)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(0 20px 30px rgba(0, 0, 0, 0.35))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(0 40px 60px rgba(0, 0, 0, 0.65)) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))";
      }
      break;
    case "Flat":
    default:
      transform3DStyle = "perspective(1200px) scale(0.92)";
      if (intensity === "Soft") {
        shadowStyle = "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.25))";
      } else if (intensity === "Dramatic") {
        shadowStyle = "drop-shadow(0 30px 45px rgba(0, 0, 0, 0.55)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))";
      }
      break;
  }

  const width = node.width || (isDesktop ? 480 : 172);
  const height = node.height || (deviceFrame === "MacBook Pro" ? 320 : isDesktop ? 310 : 364);

  const renderStaticScreen = () => {
    if (screenshotUrl) {
      const fit = data.screenFit || node.screenFit || "cover";
      const fitClass = fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : "object-cover";
      return (
        <img 
          src={screenshotUrl} 
          alt="Screenshot Preview" 
          className={`w-full h-full ${fitClass} select-none pointer-events-none z-10`} 
        />
      );
    }
    return (
      <div className="w-full h-full bg-[#0c0d12] flex flex-col items-center justify-center p-4 text-center gap-1.5 z-10">
        <svg className="w-6 h-6 text-text-dim animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 00-1.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">No Asset</span>
      </div>
    );
  };

  const renderStaticFrameBody = () => {
    // 1. Safari Browser
    if (deviceFrame === "Safari Browser") {
      return (
        <div className={`w-full h-full rounded-2xl border border-white/10 bg-[#161822] flex flex-col overflow-hidden relative ${shadowStyle}`}>
          <div className="w-full h-8 bg-[#1f2230] border-b border-white/10 px-3 flex items-center justify-between z-30 select-none">
            <div className="flex items-center gap-1.5 w-16">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <div className="flex-1 max-w-[240px] mx-auto h-5 bg-black/30 border border-white/10 rounded-md px-2.5 flex items-center justify-center gap-1 text-[9px] text-text-dim">
              <span className="truncate font-medium">mockly.app</span>
            </div>
            <div className="w-16" />
          </div>
          <div className="flex-1 relative w-full h-[calc(100%-32px)] bg-[#0c0d12] flex items-center justify-center overflow-hidden">
            {renderStaticScreen()}
            <div 
              className="absolute inset-0 pointer-events-none z-20 opacity-80"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 65%)"
              }}
            />
          </div>
        </div>
      );
    }

    // 2. Chrome Browser
    if (deviceFrame === "Chrome Browser") {
      return (
        <div className={`w-full h-full rounded-2xl border border-white/10 bg-[#1e1f26] flex flex-col overflow-hidden relative ${shadowStyle}`}>
          <div className="w-full h-7 bg-[#16171d] px-2.5 flex items-center gap-2 z-30 select-none">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <div className="h-6 px-3 bg-[#1e1f26] rounded-t-lg flex items-center gap-1.5 text-[9px] text-foreground-pure border-t border-x border-white/10 max-w-[130px]">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="truncate font-medium">Mockly</span>
            </div>
          </div>
          <div className="w-full h-7 bg-[#1e1f26] border-b border-white/10 px-2.5 flex items-center gap-2 z-30">
            <div className="flex-1 h-5 bg-black/40 border border-white/5 rounded-full px-2.5 flex items-center gap-1 text-[9px] text-text-dim">
              <span className="truncate font-medium text-text-muted">https://mockly.app</span>
            </div>
          </div>
          <div className="flex-1 relative w-full h-[calc(100%-56px)] bg-[#0c0d12] flex items-center justify-center overflow-hidden">
            {renderStaticScreen()}
            <div 
              className="absolute inset-0 pointer-events-none z-20 opacity-80"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 65%)"
              }}
            />
          </div>
        </div>
      );
    }

    // 3. MacBook Pro
    if (deviceFrame === "MacBook Pro") {
      return (
        <div className={`w-full h-full flex flex-col items-center select-none relative ${shadowStyle}`}>
          <div 
            className={`w-full flex-1 rounded-t-[14px] rounded-b-[4px] border-[5px] bg-[#0c0d12] flex flex-col overflow-hidden relative ${outerBezelBorder} ${middleBezelBg} ${lightChamferClass}`}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[34px] h-[9px] bg-[#000000] rounded-b-[5px] z-30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />
            </div>
            <div className="w-full h-full relative rounded-[3px] overflow-hidden bg-[#0c0d12] flex items-center justify-center">
              {renderStaticScreen()}
              <div 
                className="absolute inset-0 pointer-events-none z-20 opacity-80"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 65%)"
                }}
              />
            </div>
          </div>
          <div 
            className="w-[104%] -mx-[2%] h-[12px] rounded-b-[8px] flex items-start justify-center relative shadow-sm border-t border-black/40"
            style={{
              backgroundColor: activeColor.hex,
              backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(0,0,0,0.2))",
            }}
          >
            <div className="w-[52px] h-[3.5px] bg-[#090a0f] rounded-b-sm mx-auto shadow-inner" />
          </div>
        </div>
      );
    }

    // 4. Mobile Frames
    return (
      <div 
        className={`w-full h-full rounded-[38px] border-[8px] bg-[#0c0d12] flex flex-col overflow-hidden relative ${outerBezelBorder} ${middleBezelBg} ${lightChamferClass} ${shadowStyle}`}
      >
        {/* Physical side buttons with metal reflections */}
        <div 
          className="absolute -left-[10px] top-[70px] w-[3px] h-[22px] rounded-l-sm z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border-y border-black/30" 
          style={{ backgroundColor: buttonsColor }} 
        />
        <div 
          className="absolute -left-[10px] top-[98px] w-[3px] h-[22px] rounded-l-sm z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border-y border-black/30" 
          style={{ backgroundColor: buttonsColor }} 
        />
        <div 
          className="absolute -right-[10px] top-[84px] w-[3px] h-[36px] rounded-r-sm z-30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border-y border-black/30" 
          style={{ backgroundColor: buttonsColor }} 
        />

        {/* Notch dynamic layouts with glass lens reflections */}
        {(data.showIsland !== false && node.showIsland !== false) && (deviceFrame === "iPhone 17 Pro" || deviceFrame === "iPhone 16 Pro" || deviceFrame === "iPhone 15 Pro") && (
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[30%] max-w-[124px] min-w-[70px] h-[14px] bg-[#090a0f] border border-white/5 rounded-full z-30 flex items-center justify-center">
            <span 
              className="w-1.5 h-1.5 rounded-full absolute right-[25%] shadow-inner flex items-center justify-center" 
              style={{
                background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                opacity: 0.85
              }}
            >
              <span className="w-0.5 h-0.5 rounded-full bg-white/40 absolute top-0.5 left-0.5" />
            </span>
            <span className="w-1 h-1 rounded-full bg-[#1e2030] absolute left-[30%] opacity-40" />
          </div>
        )}

        {(data.showIsland !== false && node.showIsland !== false) && (deviceFrame === "iPhone 14" || deviceFrame === "iPhone 13") && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[52%] h-[18px] bg-[#090a0f] border-x border-b border-white/5 rounded-b-[10px] z-30 flex items-center justify-center">
            <span className="w-[45%] h-[2px] bg-[#222] rounded-full absolute top-[3px]" />
          </div>
        )}

        {(data.showIsland !== false && node.showIsland !== false) && deviceFrame === "Google Pixel 9 Pro" && (
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[11px] h-[11px] bg-[#090a0f] rounded-full z-30 border border-white/5 flex items-center justify-center">
            <span 
              className="w-1.5 h-1.5 rounded-full shadow-inner flex items-center justify-center"
              style={{
                background: "radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #030712 100%)",
                opacity: 0.85
              }}
            >
              <span className="w-0.5 h-0.5 rounded-full bg-white/40 absolute top-0.5 left-0.5" />
            </span>
          </div>
        )}

        {(data.showIsland !== false && node.showIsland !== false) && deviceFrame === "Samsung Galaxy S24" && (
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] bg-[#000] rounded-full z-30 border border-white/5 flex items-center justify-center" />
        )}

        {(data.showIsland !== false && node.showIsland !== false) && deviceFrame === "Sony Xperia 1 VI" && (
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-[#000] rounded-full z-30 border border-white/5 flex items-center justify-center" />
        )}

        {/* 1px inset ring */}
        <div className="absolute inset-0 rounded-[28px] border border-white/5 pointer-events-none z-20" />

        {/* Inner Glass Bezel & Screen Wrapper */}
        <div className="w-full h-full rounded-[29px] bg-black p-[3.5px] overflow-hidden flex relative">
          <div className="w-full h-full relative rounded-[25px] overflow-hidden bg-[#0c0d12] flex items-center justify-center">
            {renderStaticScreen()}
            <div 
              className="absolute inset-0 pointer-events-none z-20 opacity-85"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0) 65%)"
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
      style={{ 
        transform: transform3DStyle,
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      {renderStaticFrameBody()}
    </div>
  );
}

const nodeTypes = {
  deviceMockup: CustomDeviceNode,
  deviceNode: CustomDeviceNode,
};

interface Board {
  id: string;
  title: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  selectedBg: string;
  customBgColor: string;
  shadowIntensity: "None" | "Soft" | "Dramatic";
  paddingLevel: "Compact" | "Standard" | "Spacious";
  textAccent?: string;
  textAccentColor?: string;
  textOverlay: string;
  textPosition: "Top" | "Bottom";
  textFontSize: number;
  textColor: string;
  textWeight: "normal" | "medium" | "bold" | "extrabold";
  gridVisible: boolean;
  gridVariant: "dots" | "lines" | "cross";
  nodes: Node[];
}

interface CanvasSnapshot {
  nodes: Node[];
  aspectRatio?: "16:9" | "9:16" | "1:1";
  selectedBg: string;
  customBgColor: string;
  shadowIntensity: "None" | "Soft" | "Dramatic";
  paddingLevel: "Compact" | "Standard" | "Spacious";
  textAccent?: string;
  textAccentColor?: string;
  textOverlay: string;
  textPosition: "Top" | "Bottom";
  textFontSize: number;
  textColor: string;
  textWeight: "normal" | "medium" | "bold" | "extrabold";
}

interface InactiveBoardCanvasProps {
  board: Board;
  isLight: boolean;
  gridColor: string;
  plan: string;
  userRole: string;
}

function InactiveBoardCanvas({ board, isLight, gridColor, plan, userRole }: InactiveBoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRatio = board.aspectRatio || "16:9";
  const bDim = getBoardDimensions(currentRatio);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setScale(entry.contentRect.width / bDim.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [bDim.width]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: bDim.width,
          height: bDim.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left"
        }}
        className="w-full h-full relative"
      >
        {board.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-[40]">
            <div className="bg-[#090b11]/95 border border-border-medium rounded-[32px] p-6 flex flex-col items-center gap-3.5 shadow-2xl max-w-xs text-center select-none backdrop-blur-md">
              <div className="w-10 h-10 rounded-2xl bg-foreground/[0.03] border border-border-medium flex items-center justify-center text-text-dim">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-extrabold text-foreground-pure">Empty Slide Page</h4>
                <p className="text-[9px] text-text-dim leading-snug">
                  Click slide to activate and upload screenshots!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CSS Grid Layer */}
        {board.gridVisible && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.12]"
            style={{
              backgroundImage: board.gridVariant === "dots" 
                ? `radial-gradient(${gridColor} 1.5px, transparent 1.5px)` 
                : `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: "24px 24px"
            }}
          />
        )}

        {/* Text Overlay Layer */}
        {(board.textOverlay || board.textAccent) && (
          <div 
            className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-50 px-6"
            style={{
              top: board.textPosition === "Top" ? 40 : "auto",
              bottom: board.textPosition === "Bottom" ? 40 : "auto",
            }}
          >
            {board.textAccent && (
              <span
                className="tracking-wide uppercase font-black drop-shadow-sm select-none text-center mb-1.5"
                style={{
                  fontSize: `${Math.max(12, Math.round((board.textFontSize || 32) * 0.45))}px`,
                  color: board.textAccentColor || "#f97316",
                  letterSpacing: "0.15em",
                }}
              >
                {board.textAccent}
              </span>
            )}
            {board.textOverlay && (
              <span 
                className="tracking-tight drop-shadow-md select-none text-center leading-none"
                style={{
                  fontSize: `${board.textFontSize}px`,
                  fontWeight: board.textWeight === "normal" ? 400 : board.textWeight === "medium" ? 500 : board.textWeight === "bold" ? 700 : 800,
                  color: board.textColor || (isLight ? "#000000" : "#ffffff"),
                }}
              >
                {board.textOverlay}
              </span>
            )}
          </div>
        )}

        {/* Inset safety boundary guide */}
        <div 
          className="absolute rounded-xl border border-dashed border-white/5 pointer-events-none transition-all duration-300"
          style={{
            inset: board.paddingLevel === "Compact" ? "20px" : board.paddingLevel === "Spacious" ? "80px" : "48px",
            opacity: 0.5
          }}
        />

        {/* Static Device Mockups Render Map */}
        {board.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute pointer-events-none"
            style={{
              left: node.position?.x ?? 0,
              top: node.position?.y ?? 0,
            }}
          >
            <StaticDeviceMockup node={node} shadowIntensity={board.shadowIntensity} />
          </div>
        ))}

        {/* Live Canvas Watermark for Free Plan users (exempting Admins) */}
        {plan === "free" && userRole !== "admin" && (
          <div 
            className="absolute bottom-6 right-6 z-[100] pointer-events-none select-none flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md animate-fade-in"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.45)",
            }}
          >
            <img 
              src="/logo.png" 
              alt="Muckly Logo" 
              className="w-5 h-5 rounded-md border border-white/10 shadow-md object-cover mr-2"
            />
            <span className="text-[10px] font-black tracking-[0.12em] text-white uppercase font-sans">
              Muckly
            </span>
          </div>
        )}
      </div>

      {/* Hover Click overlay */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#090b11]/95 border border-indigo-500/30 shadow-2xl backdrop-blur-md px-5 py-3 rounded-2xl scale-95 group-hover:scale-100 transition-all select-none">
          <svg className="w-4 h-4 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-wider text-foreground-pure">
            Click to Edit Slide
          </span>
        </div>
      </div>
    </div>
  );
}

export function MockupBuilder({ plan, initialUsage, initialMockups, userRole = "user" }: MockupBuilderProps) {
  // SSR Hydration safeguard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Builder Settings
  const [title, setTitle] = useState("My App Shot");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_PRESETS[0].id);
  const [customBgColor, setCustomBgColor] = useState("");
  const [shadowIntensity, setShadowIntensity] = useState<"None" | "Soft" | "Dramatic">("Soft");
  const [paddingLevel, setPaddingLevel] = useState<"Compact" | "Standard" | "Spacious">("Standard");
  
  // Text Overlay State
  const [textAccent, setTextAccent] = useState("");
  const [textAccentColor, setTextAccentColor] = useState("#f97316");
  const [textOverlay, setTextOverlay] = useState("");
  const [textPosition, setTextPosition] = useState<"Top" | "Bottom">("Top");
  const [textFontSize, setTextFontSize] = useState<number>(32);
  const [textColor, setTextColor] = useState<string>("");
  const [textWeight, setTextWeight] = useState<"normal" | "medium" | "bold" | "extrabold">("bold");

  // Alignment Grid State
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [gridVariant, setGridVariant] = useState<"dots" | "lines" | "cross">("dots");
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);

  // React Flow Nodes
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  // History Stacks for Active Board (Undo / Redo)
  const pastRef = useRef<CanvasSnapshot[]>([]);
  const futureRef = useRef<CanvasSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Multi-Board stacking presentation slides state
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string>("");
  const prevActiveBoardIdRef = useRef<string>("");

  const hydrateLocalStates = (board: Board) => {
    setTitle(board.title);
    setAspectRatio(board.aspectRatio || "16:9");
    setSelectedBg(board.selectedBg);
    setCustomBgColor(board.customBgColor || "");
    setShadowIntensity(board.shadowIntensity || "Soft");
    setPaddingLevel(board.paddingLevel || "Standard");
    setTextAccent(board.textAccent || "");
    setTextAccentColor(board.textAccentColor || "#f97316");
    setTextOverlay(board.textOverlay || "");
    setTextPosition(board.textPosition || "Top");
    setTextFontSize(board.textFontSize || 32);
    setTextColor(board.textColor || "");
    setTextWeight(board.textWeight || "bold");
    setGridVisible(board.gridVisible !== undefined ? board.gridVisible : true);
    setGridVariant(board.gridVariant || "dots");
    setNodes(board.nodes || []);
    // Reset undo/redo history for newly focused board
    pastRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  };

  // Load saved workspace state from localStorage on mount
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem("mockly_workspace_state");
      if (saved) {
        const state = JSON.parse(saved);
        if (state.boards && Array.isArray(state.boards) && state.boards.length > 0) {
          setBoards(state.boards);
          setActiveBoardId(state.activeBoardId || state.boards[0].id);
          const active = state.boards.find((b: any) => b.id === (state.activeBoardId || state.boards[0].id)) || state.boards[0];
          hydrateLocalStates(active);
        } else {
          // Legacy format fallback
          const legacyBoard: Board = {
            id: `board-${Date.now()}`,
            title: state.title ?? "My App Shot",
            aspectRatio: state.aspectRatio ?? "16:9",
            selectedBg: state.selectedBg ?? BACKGROUND_PRESETS[0].id,
            customBgColor: state.customBgColor ?? "",
            shadowIntensity: state.shadowIntensity ?? "Soft",
            paddingLevel: state.paddingLevel ?? "Standard",
            textAccent: state.textAccent ?? "",
            textAccentColor: state.textAccentColor ?? "#f97316",
            textOverlay: state.textOverlay ?? "",
            textPosition: state.textPosition ?? "Top",
            textFontSize: state.textFontSize ?? 32,
            textColor: state.textColor ?? "",
            textWeight: state.textWeight ?? "bold",
            gridVisible: state.gridVisible !== undefined ? state.gridVisible : true,
            gridVariant: state.gridVariant ?? "dots",
            nodes: state.nodes || [],
          };
          setBoards([legacyBoard]);
          setActiveBoardId(legacyBoard.id);
          hydrateLocalStates(legacyBoard);
        }
      } else {
        // Brand new state
        const newBoard: Board = {
          id: `board-${Date.now()}`,
          title: "My App Shot",
          aspectRatio: "16:9",
          selectedBg: BACKGROUND_PRESETS[0].id,
          customBgColor: "",
          shadowIntensity: "Soft",
          paddingLevel: "Standard",
          textAccent: "",
          textAccentColor: "#f97316",
          textOverlay: "",
          textPosition: "Top",
          textFontSize: 32,
          textColor: "",
          textWeight: "bold",
          gridVisible: true,
          gridVariant: "dots",
          nodes: [],
        };
        setBoards([newBoard]);
        setActiveBoardId(newBoard.id);
        hydrateLocalStates(newBoard);
      }
    } catch (e) {
      console.error("Failed to load saved workspace state:", e);
    }
  }, [mounted]);

  // Sync active local settings back into the active board object in boards array
  useEffect(() => {
    // If we just switched the active board, do NOT sync local states back to the new board.
    // Instead, wait for the state hydration to complete to avoid race conditions.
    if (prevActiveBoardIdRef.current !== activeBoardId) {
      prevActiveBoardIdRef.current = activeBoardId;
      return;
    }

    if (!mounted || !activeBoardId || boards.length === 0) return;
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id === activeBoardId) {
          return {
            ...b,
            title,
            aspectRatio,
            selectedBg,
            customBgColor,
            shadowIntensity,
            paddingLevel,
            textAccent,
            textAccentColor,
            textOverlay,
            textPosition,
            textFontSize,
            textColor,
            textWeight,
            gridVisible,
            gridVariant,
            nodes,
          };
        }
        return b;
      })
    );
  }, [
    mounted,
    activeBoardId,
    title,
    aspectRatio,
    selectedBg,
    customBgColor,
    shadowIntensity,
    paddingLevel,
    textAccent,
    textAccentColor,
    textOverlay,
    textPosition,
    textFontSize,
    textColor,
    textWeight,
    gridVisible,
    gridVariant,
    nodes,
  ]);

  // Persist entire multi-board structure to localStorage
  useEffect(() => {
    if (!mounted || boards.length === 0) return;
    try {
      const state = {
        boards,
        activeBoardId,
      };
      localStorage.setItem("mockly_workspace_state", JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save workspace state to localStorage:", e);
    }
  }, [mounted, boards, activeBoardId]);

  const isLightColor = (hex: string) => {
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
  };

  const isBgLight = selectedBg === "white" || selectedBg === "candy" || isLightColor(customBgColor);

  // Controls open states for Collapsible sidebar groups
  const [openSections, setOpenSections] = useState({
    uploads: true,
    inspector: true,
    backdrop: false,
    composition: false,
    text: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  // Helper to trigger direct browser file download for cross-origin URLs
  const handleDirectDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 150);
    } catch (err) {
      console.error("Direct download failed, falling back to open in tab:", err);
      // Fallback: Open in new tab
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // 1. Add Board Page
  const handleAddBoard = () => {
    const newBoardId = `board-${Date.now()}`;
    const newBoard: Board = {
      id: newBoardId,
      title: `Board Page ${boards.length + 1}`,
      aspectRatio,
      selectedBg: BACKGROUND_PRESETS[0].id,
      customBgColor: "",
      shadowIntensity: "Soft",
      paddingLevel: "Standard",
      textAccent: "",
      textAccentColor: "#f97316",
      textOverlay: "",
      textPosition: "Top",
      textFontSize: 32,
      textColor: "",
      textWeight: "bold",
      gridVisible: true,
      gridVariant: "dots",
      nodes: [],
    };
    setBoards([...boards, newBoard]);
    setActiveBoardId(newBoardId);
    hydrateLocalStates(newBoard);
    showToast("Added new slide board!", "success");
  };

  // 2. Duplicate Board Page
  const handleDuplicateBoard = (boardToDuplicate: Board) => {
    const newBoardId = `board-${Date.now()}`;
    // Clone nodes with unique React Flow IDs to prevent duplication conflicts
    const clonedNodes = boardToDuplicate.nodes.map((n, i) => ({
      ...n,
      id: `node-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      selected: false,
    }));

    const duplicatedBoard: Board = {
      ...boardToDuplicate,
      id: newBoardId,
      title: `${boardToDuplicate.title} (Copy)`,
      nodes: clonedNodes,
    };

    // Insert duplicated board right after the duplicated slide
    const index = boards.findIndex((b) => b.id === boardToDuplicate.id);
    const updatedBoards = [...boards];
    updatedBoards.splice(index + 1, 0, duplicatedBoard);

    setBoards(updatedBoards);
    setActiveBoardId(newBoardId);
    hydrateLocalStates(duplicatedBoard);
    showToast("Duplicated slide board successfully!", "success");
  };

  // 3. Delete Board Page
  const handleDeleteBoard = (id: string) => {
    if (boards.length <= 1) {
      showToast("Cannot delete: You must have at least one board.", "error");
      return;
    }

    const updatedBoards = boards.filter((b) => b.id !== id);
    setBoards(updatedBoards);

    // If the active board was deleted, switch active pointer to another one
    if (activeBoardId === id) {
      const remainingBoard = updatedBoards[0];
      setActiveBoardId(remainingBoard.id);
      hydrateLocalStates(remainingBoard);
    }
    showToast("Slide board removed from workspace.", "success");
  };

  // 4. Move Board Up
  const handleMoveBoardUp = (index: number) => {
    if (index === 0) return;
    const updated = [...boards];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setBoards(updated);
  };

  // 5. Move Board Down
  const handleMoveBoardDown = (index: number) => {
    if (index === boards.length - 1) return;
    const updated = [...boards];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setBoards(updated);
  };

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [figmaUrlInput, setFigmaUrlInput] = useState("");
  const [isSyncingFigma, setIsSyncingFigma] = useState(false);
  const [figmaSyncRetrySeconds, setFigmaSyncRetrySeconds] = useState(0);
  const figmaSyncTimerRef = useRef<any>(null);
  const [figmaSyncMode, setFigmaSyncMode] = useState<"static" | "live">("live");

  // Export & Quota States
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [usageCount, setUsageCount] = useState(initialUsage);
  const [mockupsList, setMockupsList] = useState<MockupRecord[]>(initialMockups);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isFittingAspect, setIsFittingAspect] = useState(false);

  const maxScreens = (plan === "pro" || userRole === "admin") ? 7 : 3;
  const isLimitReached = userRole !== "admin" && (plan === "free" ? usageCount >= 5 : plan === "starter" ? usageCount >= 30 : false);

  // Dynamic Bounding Box calculation for rendering exact cropped preview inside the modal
  const previewData = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const x = node.position.x ?? 0;
      const y = node.position.y ?? 0;
      const w = node.width ?? 172;
      const h = node.height ?? 364;

      if (x < minX) minX = x;
      if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y;
      if (y + h > maxY) maxY = y + h;
    }

    const { width: bWidth, height: bHeight } = getBoardDimensions(aspectRatio);
    if (minX === Infinity) minX = 0;
    if (maxX === -Infinity) maxX = bWidth;
    if (minY === Infinity) minY = 0;
    if (maxY === -Infinity) maxY = bHeight;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    let paddingValue = 48; // Default Standard
    if (paddingLevel === "Compact") paddingValue = 24;
    else if (paddingLevel === "Spacious") paddingValue = 80;

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

    return {
      minX,
      minY,
      paddingTop,
      paddingLeft,
      paddingRight,
      paddingBottom,
      exportWidth,
      exportHeight,
    };
  }, [nodes, paddingLevel, textOverlay, textAccent, textPosition, textFontSize, aspectRatio]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<"fit" | "custom">("fit");
  const [customZoom, setCustomZoom] = useState<number>(100);
  const [fitScale, setFitScale] = useState<number>(1);

  useEffect(() => {
    if (!showPreviewModal) return;
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      
      const containerWidth = previewContainerRef.current.clientWidth - 48; // padding
      const containerHeight = previewContainerRef.current.clientHeight - 80; // height padding for toolbar & spacing
      
      if (containerWidth <= 0 || containerHeight <= 0) return;

      const wScale = containerWidth / previewData.exportWidth;
      const hScale = containerHeight / previewData.exportHeight;
      
      const scale = Math.min(wScale, hScale);
      setFitScale(scale > 0 ? scale : 1);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && previewContainerRef.current) {
      observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(previewContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [showPreviewModal, previewData.exportWidth, previewData.exportHeight]);

  const currentScale = zoomMode === "fit" ? fitScale : customZoom / 100;


  const handleUpgrade = () => {
    window.location.href = "/settings/billing";
  };

  // Find active node in React Flow (selected === true)
  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);

  // Dynamically compute node depths (active node on top)
  // Stable delete callback to prevent stale closures
  const handleDeleteNode = React.useCallback((id: string) => {
    deleteNode(id);
  }, []);

  const nodesWithZIndex = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      zIndex: (node.selected ? 1000 : 0) + (Number(node.data?.customZIndex) || 0),
      data: {
        ...node.data,
        shadowIntensity,
        onDelete: handleDeleteNode,
      }
    }));
  }, [nodes, shadowIntensity, handleDeleteNode]);

  const activeBg = BACKGROUND_PRESETS.find((bg) => bg.id === selectedBg) || BACKGROUND_PRESETS[0];

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processImageUploads(files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processImageUploads(files);
    }
  };

  // Add screenshot(s) to the layout sandbox with automatic side-by-side arrangement
  const processImageUploads = async (filesList: FileList | File[]) => {
    const filesArray = Array.from(filesList).filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast(`Skipped "${file.name}": Please upload a valid image file (PNG, JPG, WebP).`, "error");
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast(`Skipped "${file.name}": File size exceeds 8MB limit.`, "error");
        return false;
      }
      return true;
    });

    if (filesArray.length === 0) return;

    const currentCount = nodes.length;
    const availableSlots = maxScreens - currentCount;

    if (availableSlots <= 0) {
      showToast(`Limit reached: You can upload up to ${maxScreens} screens on your ${plan} plan.`, "error");
      if (plan !== "pro") setShowLimitModal(true);
      return;
    }

    const filesToUpload = filesArray.slice(0, availableSlots);
    const skippedCount = filesArray.length - filesToUpload.length;

    if (skippedCount > 0) {
      showToast(`Adding ${filesToUpload.length} screens. Skipped ${skippedCount} screen(s) due to ${plan} plan limits.`, "error");
      if (plan !== "pro") {
        setTimeout(() => setShowLimitModal(true), 1200);
      }
    }

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file, i) => {
        // Base64 read inside a promise
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
        });

        // Detect screenshot dimensions to match aspect ratio
        let calculatedWidth = 172;
        let calculatedHeight = 364; // Default fallback if measurement fails
        let detectedDeviceFrame = "iPhone 17 Pro";

        try {
          const img = new Image();
          img.src = base64Data;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          if (img.width && img.height) {
            const aspect = img.width / img.height;
            if (aspect >= 1.2) {
              detectedDeviceFrame = "Safari Browser";
              calculatedWidth = 480;
              calculatedHeight = Math.round(calculatedWidth / aspect);
              if (calculatedHeight < 280) calculatedHeight = 280;
              if (calculatedHeight > 340) calculatedHeight = 340;
            } else {
              calculatedWidth = 172;
              calculatedHeight = Math.round(calculatedWidth / aspect);
            }
          }
        } catch (e) {
          console.error("Failed to pre-calculate image aspect ratio:", e);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64Data,
            fileName: file.name,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload "${file.name}".`);

        // Arrange new custom device mockup nodes side-by-side with appropriate offset
        const nodeIndex = currentCount + i;
        const xOffset = detectedDeviceFrame === "Safari Browser" ? 500 : 220;
        const xPos = 160 + (nodeIndex * xOffset) % (1200 - calculatedWidth - 40); 
        const yPos = 120 + Math.floor((nodeIndex * xOffset) / (1200 - calculatedWidth - 40)) * 60;

        const spawnedNode: Node = {
          id: `node-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          type: "deviceMockup",
          position: {
            x: xPos,
            y: yPos,
          },
          width: calculatedWidth,
          height: calculatedHeight,
          data: {
            screenshotUrl: data.url,
            deviceFrame: detectedDeviceFrame,
            frameColor: FRAME_COLORS[0].id,
            tilt: ANGLES[0].id,
          },
          selected: i === filesToUpload.length - 1, // Select the last spawned node
        };
        return spawnedNode;
      });

      const spawnedNodes = await Promise.all(uploadPromises);

      // Add to state and set selected states correctly
      takeSnapshot();
      setNodes((nds) => {
        const updatedExisting = nds.map((n) => ({ ...n, selected: false }));
        return [...updatedExisting, ...spawnedNodes] as Node[];
      });

      showToast(`Added ${filesToUpload.length} screen(s) to workspace!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "An unexpected error occurred during upload.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Client-side Figma URL parser for Live Embeds
  const parseFigmaUrlClient = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2 || (pathParts[0] !== "design" && pathParts[0] !== "file" && pathParts[0] !== "proto")) {
        return null;
      }
      const fileKey = pathParts[1];
      const rawNodeIds = urlObj.searchParams.getAll("node-id");
      const nodeIds = rawNodeIds.flatMap((id) => id.split(",").map((x) => x.trim())).filter(Boolean);
      const resolvedNodeIds = nodeIds.map((id) => id.replace(/-/g, ":"));
      return { fileKey, nodeIds: resolvedNodeIds };
    } catch (e) {
      return null;
    }
  };

  const handleSyncFigmaLive = () => {
    const currentCount = nodes.length;
    const parsed = parseFigmaUrlClient(figmaUrlInput);
    
    let fileKey = "";
    let nodeIds: string[] = [];
    
    if (parsed) {
      fileKey = parsed.fileKey;
      nodeIds = parsed.nodeIds;
    } else {
      const match = figmaUrlInput.match(/file\/([a-zA-Z0-9]+)/) || 
                    figmaUrlInput.match(/design\/([a-zA-Z0-9]+)/) || 
                    figmaUrlInput.match(/proto\/([a-zA-Z0-9]+)/);
      if (match) {
        fileKey = match[1];
      }
    }

    if (!fileKey) {
      showToast("Invalid Figma URL format. Please paste a valid Figma design or selection link.", "error");
      return;
    }

    // Default to canvas/page 0:1 if no specific frame is selected
    const targets = nodeIds.length > 0 ? nodeIds : ["0:1"];
    
    // Check limit
    let screensToImport = targets;
    const spaceLeft = maxScreens - currentCount;
    if (screensToImport.length > spaceLeft) {
      screensToImport = screensToImport.slice(0, spaceLeft);
      showToast(`Omitted ${targets.length - spaceLeft} screen(s) to stay within your plan limit of ${maxScreens} screens.`, "error");
    }

    if (screensToImport.length === 0) return;

    const newNodesList: Node[] = [];

    for (let idx = 0; idx < screensToImport.length; idx++) {
      const nodeId = screensToImport[idx];
      // Construct a clean, auto-scaled prototype URL without sidebar/hotspot indicators and override any preset device frame.
      // We pass hide-ui=1 and device-frame=false to the outer embed wrapper to hide header/footer chrome and avoid double-device wrapping.
      const targetProtoUrl = `https://www.figma.com/proto/${fileKey}?node-id=${nodeId.replace(/:/g, "-")}&scaling=scale-down&content-scaling=fixed&show-proto-sidebar=0&hotspot-hints=0&device-frame=false`;
      const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(targetProtoUrl)}&hide-ui=1&device-frame=false`;

      const nodeIndex = currentCount + idx;
      const xPos = 200 + (nodeIndex * 260) % (1200 - 172 - 100);
      const yPos = 120 + Math.floor((nodeIndex * 260) / (1200 - 172 - 100)) * 420;

      const spawnedNode: Node = {
        id: `node-embed-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        type: "deviceMockup",
        position: {
          x: xPos,
          y: yPos,
        },
        width: 172,
        height: 364,
        data: {
          isEmbed: true,
          embedUrl,
          interactive: false,
          deviceFrame: "iPhone 17 Pro",
          frameColor: FRAME_COLORS[0].id,
          tilt: ANGLES[0].id,
          onDelete: handleDeleteNode,
        },
        selected: idx === screensToImport.length - 1,
      };

      newNodesList.push(spawnedNode);
    }

    takeSnapshot();
    setNodes((nds) => {
      const updatedExisting = nds.map((n) => ({ ...n, selected: false }));
      return [...updatedExisting, ...newNodesList] as Node[];
    });

    showToast(`Successfully synced ${newNodesList.length} Figma Live Embed(s)!`, "success");
    setFigmaUrlInput("");
  };

  const handleSyncFigma = async () => {
    if (!figmaUrlInput.trim()) return;

    if (figmaSyncMode === "live") {
      handleSyncFigmaLive();
      return;
    }

    const currentCount = nodes.length;
    if (currentCount >= maxScreens) {
      showToast(`Limit reached: You can upload up to ${maxScreens} screens on your ${plan} plan.`, "error");
      if (plan !== "pro") setShowLimitModal(true);
      return;
    }

    setIsSyncingFigma(true);

    try {
      const res = await fetch("/api/figma/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl: figmaUrlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync from Figma.");

      const incomingScreens = data.screenshots || [];
      if (incomingScreens.length === 0) {
        throw new Error("No valid screens were returned by Figma.");
      }

      // Check if importing all screens would exceed the limit
      let screensToImport = incomingScreens;
      const spaceLeft = maxScreens - currentCount;
      if (screensToImport.length > spaceLeft) {
        screensToImport = screensToImport.slice(0, spaceLeft);
        showToast(`Omitted ${incomingScreens.length - spaceLeft} screen(s) to stay within your plan limit of ${maxScreens} screens.`, "error");
      }

      const newNodesList: Node[] = [];

      for (let idx = 0; idx < screensToImport.length; idx++) {
        const screen = screensToImport[idx];
        
        // Detect dimensions for this specific screen
        let calculatedWidth = 172;
        let calculatedHeight = 364; // Default fallback
        let detectedDeviceFrame = "iPhone 17 Pro";

        try {
          const img = new Image();
          img.src = screen.url;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          if (img.width && img.height) {
            const aspect = img.width / img.height;
            if (aspect >= 1.2) {
              detectedDeviceFrame = "Safari Browser";
              calculatedWidth = 480;
              calculatedHeight = Math.round(calculatedWidth / aspect);
              if (calculatedHeight < 280) calculatedHeight = 280;
              if (calculatedHeight > 340) calculatedHeight = 340;
            } else {
              calculatedWidth = 172;
              calculatedHeight = Math.round(calculatedWidth / aspect);
            }
          }
        } catch (e) {
          console.error("Failed to pre-calculate image aspect ratio:", e);
        }

        const nodeIndex = currentCount + idx;
        const xOffset = detectedDeviceFrame === "Safari Browser" ? 500 : 260;
        const xPos = 160 + (nodeIndex * xOffset) % (1200 - calculatedWidth - 40);
        const yPos = 120 + Math.floor((nodeIndex * xOffset) / (1200 - calculatedWidth - 40)) * 420;

        const spawnedNode: Node = {
          id: `node-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          type: "deviceMockup",
          position: {
            x: xPos,
            y: yPos,
          },
          width: calculatedWidth,
          height: calculatedHeight,
          data: {
            screenshotUrl: screen.url,
            deviceFrame: detectedDeviceFrame,
            frameColor: FRAME_COLORS[0].id,
            tilt: ANGLES[0].id,
          },
          selected: idx === screensToImport.length - 1, // select the last imported one
        };

        newNodesList.push(spawnedNode);
      }

      takeSnapshot();
      setNodes((nds) => {
        const updatedExisting = nds.map((n) => ({ ...n, selected: false }));
        return [...updatedExisting, ...newNodesList] as Node[];
      });

      showToast(`Successfully synced ${newNodesList.length} screen(s) from Figma!`, "success");
      setFigmaUrlInput(""); // Reset input
      setFigmaSyncRetrySeconds(0);
      if (figmaSyncTimerRef.current) {
        clearInterval(figmaSyncTimerRef.current);
        figmaSyncTimerRef.current = null;
      }
    } catch (err: any) {
      console.error(err);
      
      // Parse retry-after seconds if present
      const match = err.message.match(/wait (\d+) seconds/i);
      if (match) {
        const seconds = parseInt(match[1], 10);
        setFigmaSyncRetrySeconds(seconds);
        setIsSyncingFigma(true); // Keep loading active
        
        // Start countdown timer
        if (figmaSyncTimerRef.current) clearInterval(figmaSyncTimerRef.current);
        let currentSeconds = seconds;
        figmaSyncTimerRef.current = setInterval(() => {
          currentSeconds--;
          setFigmaSyncRetrySeconds(currentSeconds);
          if (currentSeconds <= 0) {
            clearInterval(figmaSyncTimerRef.current);
            figmaSyncTimerRef.current = null;
            setFigmaSyncRetrySeconds(0);
            // Re-trigger sync automatically
            handleSyncFigma();
          }
        }, 1000);
        
        showToast(`Rate limit active. Retrying automatically in ${seconds}s...`, "error");
      } else {
        showToast(err.message || "An unexpected error occurred during Figma sync.", "error");
        setIsSyncingFigma(false);
      }
    }
  };

  const handleSwitchSyncMode = (mode: "static" | "live") => {
    setFigmaSyncMode(mode);
    if (figmaSyncTimerRef.current) {
      clearInterval(figmaSyncTimerRef.current);
      figmaSyncTimerRef.current = null;
    }
    setFigmaSyncRetrySeconds(0);
    setIsSyncingFigma(false);
  };

  const processImageUploadsForBoard = async (filesList: FileList | File[], targetBoardId: string) => {
    const filesArray = Array.from(filesList).filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast(`Skipped "${file.name}": Please upload a valid image file (PNG, JPG, WebP).`, "error");
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast(`Skipped "${file.name}": File size exceeds 8MB limit.`, "error");
        return false;
      }
      return true;
    });

    if (filesArray.length === 0) return;

    const targetBoard = boards.find((b) => b.id === targetBoardId);
    if (!targetBoard) return;

    const currentCount = targetBoard.nodes?.length || 0;
    const availableSlots = maxScreens - currentCount;

    if (availableSlots <= 0) {
      showToast(`Limit reached: You can upload up to ${maxScreens} screens on your ${plan} plan.`, "error");
      if (plan !== "pro") setShowLimitModal(true);
      return;
    }

    const filesToUpload = filesArray.slice(0, availableSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file, i) => {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
        });

        // Detect screenshot dimensions to match aspect ratio
        let calculatedWidth = 172;
        let calculatedHeight = 364; // Default fallback if measurement fails
        let detectedDeviceFrame = "iPhone 17 Pro";

        try {
          const img = new Image();
          img.src = base64Data;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          if (img.width && img.height) {
            const aspect = img.width / img.height;
            if (aspect >= 1.2) {
              detectedDeviceFrame = "Safari Browser";
              calculatedWidth = 480;
              const bezels = getFrameBezels("Safari Browser");
              const innerW = Math.max(10, calculatedWidth - bezels.w);
              calculatedHeight = Math.round(innerW / aspect) + bezels.h;
              if (calculatedHeight < 280) calculatedHeight = 280;
              if (calculatedHeight > 340) calculatedHeight = 340;
            } else {
              calculatedWidth = 172;
              const bezels = getFrameBezels(detectedDeviceFrame);
              const innerW = Math.max(10, calculatedWidth - bezels.w);
              calculatedHeight = Math.round(innerW / aspect) + bezels.h;
            }
          }
        } catch (e) {
          console.error("Failed to pre-calculate image aspect ratio:", e);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64Data,
            fileName: file.name,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload "${file.name}".`);

        const nodeIndex = currentCount + i;
        const xOffset = detectedDeviceFrame === "Safari Browser" ? 500 : 220;
        const xPos = 160 + (nodeIndex * xOffset) % (1200 - calculatedWidth - 40); 
        const yPos = 120 + Math.floor((nodeIndex * xOffset) / (1200 - calculatedWidth - 40)) * 60;

        const spawnedNode: Node = {
          id: `node-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          type: "deviceMockup",
          position: {
            x: xPos,
            y: yPos,
          },
          width: calculatedWidth,
          height: calculatedHeight,
          data: {
            screenshotUrl: data.url,
            deviceFrame: detectedDeviceFrame,
            frameColor: FRAME_COLORS[0].id,
            tilt: ANGLES[0].id,
            screenFit: "cover",
            showIsland: true,
          },
          selected: i === filesToUpload.length - 1, // Select the last spawned node
        };
        return spawnedNode;
      });

      const spawnedNodes = await Promise.all(uploadPromises);

      // Add to boards array
      setBoards((prev) =>
        prev.map((b) => {
          if (b.id === targetBoardId) {
            const updatedExisting = (b.nodes || []).map((n) => ({ ...n, selected: false }));
            return {
              ...b,
              nodes: [...updatedExisting, ...spawnedNodes] as Node[],
            };
          }
          return b;
        })
      );

      // Hydrate & activate target board immediately
      setActiveBoardId(targetBoardId);
      const updatedTargetBoard = {
        ...targetBoard,
        nodes: [...(targetBoard.nodes || []).map((n) => ({ ...n, selected: false })), ...spawnedNodes] as Node[],
      };
      hydrateLocalStates(updatedTargetBoard);

      showToast(`Added ${filesToUpload.length} screen(s) to "${targetBoard.title}"!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "An unexpected error occurred during upload.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteNode = (id: string) => {
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    showToast("Screen removed from workspace.", "success");
  };

  // Settings modification updates data properties of the highlighted node
  const updateSelectedNode = (field: string, value: any) => {
    if (!selectedNode) return;
    takeSnapshot();
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          let updatedWidth = node.width;
          let updatedHeight = node.height;

          if (field === "deviceFrame") {
            const wasDesktop = isDesktopFrame(node.data?.deviceFrame as string | undefined);
            const isNowDesktop = isDesktopFrame(value);

            if (!wasDesktop && isNowDesktop) {
              // Switched from mobile to desktop
              updatedWidth = 480;
              updatedHeight = value === "MacBook Pro" ? 320 : 310;
            } else if (wasDesktop && !isNowDesktop) {
              // Switched from desktop to mobile
              updatedWidth = 172;
              updatedHeight = 364;
            } else if (wasDesktop && isNowDesktop) {
              // Switching between desktop models (e.g. MacBook Pro vs Safari)
              if (value === "MacBook Pro" && node.data?.deviceFrame !== "MacBook Pro") {
                updatedHeight = Math.round((Number(updatedHeight) || 310) * (320 / 310));
              } else if (value !== "MacBook Pro" && node.data?.deviceFrame === "MacBook Pro") {
                updatedHeight = Math.round((Number(updatedHeight) || 320) * (310 / 320));
              }
            }
          }

          return {
            ...node,
            width: updatedWidth,
            height: updatedHeight,
            data: {
              ...node.data,
              [field]: value,
            },
          };
        }
        return node;
      })
    );
  };

  const updateSelectedNodeDimensions = (newWidth: number) => {
    if (!selectedNode) return;
    takeSnapshot();
    const currentW = selectedNode.width || 172;
    const currentH = selectedNode.height || 364;
    const bezels = getFrameBezels(selectedNode.data?.deviceFrame as string | undefined);
    const innerW = Math.max(10, currentW - bezels.w);
    const innerH = Math.max(10, currentH - bezels.h);
    const ratio = innerH / innerW;
    const newInnerW = Math.max(10, newWidth - bezels.w);
    const newH = Math.round(newInnerW * ratio) + bezels.h;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            width: newWidth,
            height: newH,
          };
        }
        return node;
      })
    );
  };

  // Bring selected node to the absolute front of the stack
  const bringToFront = () => {
    if (!selectedNode) return;
    takeSnapshot();
    const maxZ = nodes.reduce((max, node) => {
      const z = Number(node.data?.customZIndex) || 0;
      return z > max ? z : max;
    }, 0);
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              customZIndex: maxZ + 1,
            },
          };
        }
        return node;
      })
    );
    showToast("Brought selected mockup to front!", "success");
  };

  // Send selected node to the absolute back of the stack
  const sendToBack = () => {
    if (!selectedNode) return;
    takeSnapshot();
    const minZ = nodes.reduce((min, node) => {
      const z = Number(node.data?.customZIndex) || 0;
      return z < min ? z : min;
    }, 0);

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              customZIndex: minZ - 1,
            },
          };
        }
        return node;
      })
    );
    showToast("Sent selected mockup to back!", "success");
  };

  const fitSelectedNodeToAspectRatio = async () => {
    if (!selectedNode || !selectedNode.data?.screenshotUrl) return;
    setIsFittingAspect(true);
    try {
      const img = new Image();
      img.src = (selectedNode.data as any)?.screenshotUrl || "";
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

      if (img.width && img.height) {
        const aspect = img.width / img.height;
        const currentWidth = selectedNode.width || 172;
        const bezels = getFrameBezels(selectedNode.data?.deviceFrame as string | undefined);
        const innerW = Math.max(10, currentWidth - bezels.w);
        const innerH = Math.round(innerW / aspect);
        const newHeight = innerH + bezels.h;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === selectedNode.id
              ? { ...n, height: newHeight }
              : n
          )
        );
        showToast("Mockup frame fitted to screenshot aspect ratio!", "success");
      } else {
        showToast("Unable to detect screenshot dimensions.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error fitting mockup to screenshot aspect ratio.", "error");
    } finally {
      setIsFittingAspect(false);
    }
  };

  // Interactive sandbox dynamic scale scaling hook
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const bDim = getBoardDimensions(aspectRatio);
        setScale(width / bDim.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mounted, aspectRatio]);

  // Export PNG compiles complete coordinate array
  const handleExport = async (boardToExport?: Board) => {
    const targetBoard = boardToExport || {
      id: activeBoardId,
      title,
      aspectRatio,
      selectedBg,
      customBgColor,
      shadowIntensity,
      paddingLevel,
      textAccent,
      textAccentColor,
      textOverlay,
      textPosition,
      textFontSize,
      textColor,
      textWeight,
      gridVisible,
      gridVariant,
      nodes,
    };

    if (targetBoard.nodes.length === 0) {
      showToast(`Please upload at least one screenshot to "${targetBoard.title}" first!`, "error");
      return;
    }

    const hasLiveEmbed = targetBoard.nodes.some(
      (n) => Boolean((n as any).isEmbed || n.data?.isEmbed) && !((n as any).screenshotUrl || n.data?.screenshotUrl)
    );
    if (hasLiveEmbed) {
      showToast('Live Figma embeds cannot be directly exported as static PNGs. Please click "Sync as Image" in the Figma tab or upload a static screenshot before exporting.', "error");
      return;
    }

    const hasAnyScreenshot = targetBoard.nodes.some(
      (n) => Boolean((n as any).screenshotUrl || n.data?.screenshotUrl)
    );
    if (!hasAnyScreenshot) {
      showToast(`Please upload at least one screenshot to "${targetBoard.title}" before exporting!`, "error");
      return;
    }

    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }

    setIsExporting(true);

    try {
      // Map React Flow nodes list to simplified absolute payload coordinate structures
      const nodesPayload = targetBoard.nodes.map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        width: n.width || 172,
        height: n.height || 364,
        isEmbed: Boolean((n as any).isEmbed || n.data?.isEmbed),
        screenshotUrl: (n as any).screenshotUrl || n.data?.screenshotUrl,
        deviceFrame: (n as any).deviceFrame || n.data?.deviceFrame,
        frameColor: (n as any).frameColor || n.data?.frameColor,
        tilt: (n as any).tilt || n.data?.tilt,
        screenFit: (n as any).screenFit || n.data?.screenFit || "cover",
        showIsland: (n as any).showIsland !== undefined ? (n as any).showIsland : n.data?.showIsland !== undefined ? n.data?.showIsland : true,
        selected: n.selected || false,
        zIndex: (n as any).zIndex || (n.selected ? 1000 : 0) + (Number(n.data?.customZIndex) || 0),
      }));

      console.log("[Export Debug] Payload nodes count:", nodesPayload.length);
      console.log("[Export Debug] First node sample:", JSON.stringify(nodesPayload[0], null, 2));

      const requestBody = {
        title: targetBoard.title.trim() || "My App Mockup",
        aspectRatio: targetBoard.aspectRatio || "16:9",
        background: targetBoard.selectedBg,
        customBgColor: targetBoard.customBgColor || null,
        shadowIntensity: targetBoard.shadowIntensity,
        paddingLevel: targetBoard.paddingLevel,
        textAccent: targetBoard.textAccent ? targetBoard.textAccent.trim() : null,
        textAccentColor: targetBoard.textAccentColor || null,
        textOverlay: targetBoard.textOverlay ? targetBoard.textOverlay.trim() : null,
        textPosition: targetBoard.textPosition,
        textFontSize: targetBoard.textFontSize,
        textColor: targetBoard.textColor || null,
        textWeight: targetBoard.textWeight,
        nodes: nodesPayload,
        // Legacy backward compatibility placeholders
        screenshotUrl: nodesPayload[0]?.screenshotUrl || null,
        deviceFrame: nodesPayload[0]?.deviceFrame || null,
        tilt: nodesPayload[0]?.tilt || null,
      };

      console.log("[Export Debug] background:", requestBody.background);
      console.log("[Export Debug] screenshotUrl present:", !!requestBody.screenshotUrl);

      const res = await fetch("/api/mockups/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("[Export Debug] Response status:", res.status, "data:", data);
      if (!res.ok) throw new Error(data.error || "Export failed.");

      setMockupsList([data.mockup, ...mockupsList]);
      setUsageCount((prev) => prev + 1);
      showToast(`Exported "${targetBoard.title}" successfully!`, "success");

      await handleDirectDownload(
        data.mockup.mockupUrl,
        `${targetBoard.title.replace(/\s+/g, "-").toLowerCase()}-mockup.png`
      );

    } catch (err: any) {
      console.error("[Export Debug] Export error:", err);
      console.error("[Export Debug] Error message:", err.message);
      showToast(err.message || "Failed to generate mockup.", "error");
      if (err.message && (err.message.toLowerCase().includes("limit") || err.message.toLowerCase().includes("upgrade"))) {
        setShowLimitModal(true);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const [isBulkExporting, setIsBulkExporting] = useState(false);

  const handleBulkExport = async () => {
    const validBoards = boards.filter((b) => b.nodes.length > 0);
    if (validBoards.length === 0) {
      showToast("None of your boards contain screenshots. Please add assets before exporting!", "error");
      return;
    }

    const hasAnyLiveEmbed = validBoards.some((b) =>
      b.nodes.some((n) => Boolean((n as any).isEmbed || n.data?.isEmbed) && !((n as any).screenshotUrl || n.data?.screenshotUrl))
    );
    if (hasAnyLiveEmbed) {
      showToast('One or more slides contain Live Figma embeds. Please click "Sync as Image" or upload static screenshots before bulk exporting.', "error");
      return;
    }

    const limit = plan === "free" ? 5 : plan === "starter" ? 30 : Infinity;
    if (userRole !== "admin" && usageCount + validBoards.length > limit) {
      setShowLimitModal(true);
      return;
    }

    setIsBulkExporting(true);
    showToast(`Bulk exporting ${validBoards.length} slides... Please wait!`, "success");

    try {
      // Export all boards concurrently
      const exportPromises = validBoards.map((b) => handleExport(b));
      await Promise.all(exportPromises);
      showToast("All mockups compiled and downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Bulk export encountered errors:", err);
    } finally {
      setIsBulkExporting(false);
    }
  };

  // --- CANVAS HISTORY ENGINE (UNDO / REDO) ---
  const getCurrentSnapshot = useCallback((): CanvasSnapshot => ({
    nodes: JSON.parse(JSON.stringify(nodes)),
    aspectRatio,
    selectedBg,
    customBgColor,
    shadowIntensity,
    paddingLevel,
    textAccent,
    textAccentColor,
    textOverlay,
    textPosition,
    textFontSize,
    textColor,
    textWeight,
  }), [nodes, aspectRatio, selectedBg, customBgColor, shadowIntensity, paddingLevel, textAccent, textAccentColor, textOverlay, textPosition, textFontSize, textColor, textWeight]);

  const takeSnapshot = useCallback(() => {
    const current = getCurrentSnapshot();
    pastRef.current = [...pastRef.current.slice(-24), current];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [getCurrentSnapshot]);

  const applySnapshot = (snapshot: CanvasSnapshot) => {
    setNodes(snapshot.nodes);
    setAspectRatio(snapshot.aspectRatio || "16:9");
    setSelectedBg(snapshot.selectedBg);
    setCustomBgColor(snapshot.customBgColor);
    setShadowIntensity(snapshot.shadowIntensity);
    setPaddingLevel(snapshot.paddingLevel);
    setTextAccent(snapshot.textAccent || "");
    setTextAccentColor(snapshot.textAccentColor || "#f97316");
    setTextOverlay(snapshot.textOverlay);
    setTextPosition(snapshot.textPosition);
    setTextFontSize(snapshot.textFontSize);
    setTextColor(snapshot.textColor);
    setTextWeight(snapshot.textWeight);
  };

  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [getCurrentSnapshot(), ...futureRef.current.slice(0, 24)];
    applySnapshot(previous);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
    showToast("Undo", "info");
  }, [getCurrentSnapshot]);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current.slice(-24), getCurrentSnapshot()];
    applySnapshot(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    showToast("Redo", "info");
  }, [getCurrentSnapshot]);

  // Global Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const modifier = e.metaKey || e.ctrlKey;
      if (modifier && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (modifier && e.key.toLowerCase() === "y") ||
        (modifier && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // --- SMART ALIGNMENT & DISTRIBUTION TOOLS ---
  const getSelectedOrAllNodes = () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    return selectedNodes.length > 1 ? selectedNodes : nodes;
  };

  const alignCenterH = () => {
    if (nodes.length === 0) return;
    takeSnapshot();
    const { width: bWidth } = getBoardDimensions(aspectRatio);
    const targets = getSelectedOrAllNodes();
    const targetIds = new Set(targets.map((n) => n.id));

    if (targets.length === 1) {
      const node = targets[0];
      const w = node.width || 172;
      const centeredX = Math.round((bWidth - w) / 2);
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: { ...n.position, x: centeredX } } : n)));
      showToast("Centered horizontally", "info");
      return;
    }

    const minX = Math.min(...targets.map((n) => n.position.x));
    const maxX = Math.max(...targets.map((n) => n.position.x + (n.width || 172)));
    const boundingWidth = maxX - minX;
    const targetCenter = (bWidth - boundingWidth) / 2;
    const shift = Math.round(targetCenter - minX);

    setNodes((nds) =>
      nds.map((n) => (targetIds.has(n.id) ? { ...n, position: { ...n.position, x: n.position.x + shift } } : n))
    );
    showToast("Aligned center horizontally", "info");
  };

  const alignCenterV = () => {
    if (nodes.length === 0) return;
    takeSnapshot();
    const { height: bHeight } = getBoardDimensions(aspectRatio);
    const targets = getSelectedOrAllNodes();
    const targetIds = new Set(targets.map((n) => n.id));

    if (targets.length === 1) {
      const node = targets[0];
      const h = node.height || 364;
      const centeredY = Math.round((bHeight - h) / 2);
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, position: { ...n.position, y: centeredY } } : n)));
      showToast("Centered vertically", "info");
      return;
    }

    const minY = Math.min(...targets.map((n) => n.position.y));
    const maxY = Math.max(...targets.map((n) => n.position.y + (n.height || 364)));
    const boundingHeight = maxY - minY;
    const targetCenter = (bHeight - boundingHeight) / 2;
    const shift = Math.round(targetCenter - minY);

    setNodes((nds) =>
      nds.map((n) => (targetIds.has(n.id) ? { ...n, position: { ...n.position, y: n.position.y + shift } } : n))
    );
    showToast("Aligned center vertically", "info");
  };

  const alignTops = () => {
    const targets = getSelectedOrAllNodes();
    if (targets.length < 2) return;
    takeSnapshot();
    const targetIds = new Set(targets.map((n) => n.id));
    const minY = Math.min(...targets.map((n) => n.position.y));

    setNodes((nds) =>
      nds.map((n) => (targetIds.has(n.id) ? { ...n, position: { ...n.position, y: minY } } : n))
    );
    showToast("Aligned top edges", "info");
  };

  const alignBottoms = () => {
    const targets = getSelectedOrAllNodes();
    if (targets.length < 2) return;
    takeSnapshot();
    const targetIds = new Set(targets.map((n) => n.id));
    const maxBottom = Math.max(...targets.map((n) => n.position.y + (n.height || 364)));

    setNodes((nds) =>
      nds.map((n) =>
        targetIds.has(n.id)
          ? { ...n, position: { ...n.position, y: maxBottom - (n.height || 364) } }
          : n
      )
    );
    showToast("Aligned bottom edges", "info");
  };

  const distributeEvenly = () => {
    const targets = getSelectedOrAllNodes();
    if (targets.length < 2) return;
    takeSnapshot();

    const sorted = [...targets].sort((a, b) => a.position.x - b.position.x);
    const count = sorted.length;
    const totalWidth = sorted.reduce((sum, n) => sum + (n.width || 172), 0);

    const maxClusterWidth = Math.min(1050, 1200 - 80);
    const availableGapSpace = maxClusterWidth - totalWidth;
    const gap = Math.max(24, Math.min(60, Math.floor(availableGapSpace / (count - 1))));
    const clusterWidth = totalWidth + (count - 1) * gap;
    const startX = Math.max(30, Math.round((1200 - clusterWidth) / 2));

    const newPositions = new Map<string, number>();
    let currX = startX;
    for (const node of sorted) {
      newPositions.set(node.id, currX);
      currX += (node.width || 172) + gap;
    }

    setNodes((nds) =>
      nds.map((n) => {
        if (newPositions.has(n.id)) {
          return { ...n, position: { ...n.position, x: newPositions.get(n.id)! } };
        }
        return n;
      })
    );
    showToast("Distributed evenly across canvas", "info");
  };

  const autoCascade = () => {
    if (nodes.length === 0) return;
    takeSnapshot();
    const { width: bWidth, height: bHeight } = getBoardDimensions(aspectRatio);

    if (nodes.length === 1) {
      setNodes((nds) => [
        {
          ...nds[0],
          position: {
            x: Math.round((bWidth - (nds[0].width || 172)) / 2),
            y: Math.round((bHeight - (nds[0].height || 364)) / 2),
          },
          data: { ...nds[0].data, tilt: "Floating" },
        },
      ]);
      showToast("Preset: Hero Centered", "success");
      return;
    }

    if (nodes.length === 2) {
      const w = nodes[0].width || 172;
      const spacing = Math.round(w * 0.35);
      const totalW = w * 2 + spacing;
      const startX = Math.round((bWidth - totalW) / 2);
      const startY = Math.round((bHeight - (nodes[0].height || 364)) / 2);

      setNodes((nds) => [
        {
          ...nds[0],
          position: { x: startX, y: startY },
          data: { ...nds[0].data, tilt: "Left Tilt", customZIndex: 1 },
        },
        {
          ...nds[1],
          position: { x: startX + w + spacing, y: startY },
          data: { ...nds[1].data, tilt: "Right Tilt", customZIndex: 2 },
        },
      ]);
      showToast("Preset: Isometric Duo", "success");
      return;
    }

    if (nodes.length === 3) {
      const w = nodes[0].width || 172;
      const h = nodes[0].height || 364;
      const spacing = Math.round(w * 0.25);
      const totalW = w * 3 + spacing * 2;
      const startX = Math.round((bWidth - totalW) / 2);
      const centerY = Math.round((bHeight - h) / 2);

      setNodes((nds) => [
        {
          ...nds[0],
          position: { x: startX, y: centerY + 20 },
          data: { ...nds[0].data, tilt: "Left Tilt", customZIndex: 1 },
        },
        {
          ...nds[1],
          position: { x: startX + w + spacing, y: centerY - 20 },
          data: { ...nds[1].data, tilt: "Floating", customZIndex: 5 },
        },
        {
          ...nds[2],
          position: { x: startX + (w + spacing) * 2, y: centerY + 20 },
          data: { ...nds[2].data, tilt: "Right Tilt", customZIndex: 1 },
        },
      ]);
      showToast("Preset: Hero Launch Trio", "success");
      return;
    }

    const count = nodes.length;
    const availableW = Math.round(bWidth * 0.8);
    const stepX = Math.min(180, Math.floor(availableW / (count - 1)));
    const startX = Math.round((bWidth - (stepX * (count - 1) + 172)) / 2);
    const startY = Math.round((bHeight - (nodes[0]?.height || 364)) / 2);
    setNodes((nds) =>
      nds.map((node, idx) => ({
        ...node,
        position: {
          x: startX + idx * stepX,
          y: startY + (idx % 2 === 0 ? 0 : 25),
        },
        data: {
          ...node.data,
          tilt: idx === 0 ? "Left Tilt" : idx === count - 1 ? "Right Tilt" : "Floating",
          customZIndex: idx + 1,
        },
      }))
    );
    showToast(`Preset: ${count}-Device Cascade`, "success");
  };

  const applyStockAnalysisTemplate = () => {
    takeSnapshot();
    const { width: bWidth } = getBoardDimensions("9:16");
    const nodeWidth = 420;
    const nodeHeight = 884;
    const centeredX = Math.round((bWidth - nodeWidth) / 2);
    const centeredY = 220;

    const templateNode: Node = {
      id: `node-${Date.now()}`,
      type: "deviceMockup",
      position: { x: centeredX, y: centeredY },
      width: nodeWidth,
      height: nodeHeight,
      data: {
        deviceFrame: "iPhone 16 Pro",
        frameColor: "Space Black",
        tilt: "Flat",
        shadowIntensity: "Soft",
        screenshotUrl: "/templates/stock-analysis.png",
        screenFit: "cover",
        showIsland: false,
        customZIndex: 1,
      },
    };

    setAspectRatio("9:16");
    setSelectedBg("minimal-frost");
    setCustomBgColor("");
    setShadowIntensity("Soft");
    setPaddingLevel("Standard");
    setTextAccent("Top Expert");
    setTextAccentColor("#f97316");
    setTextOverlay("Stock Analysis");
    setTextColor("#000000");
    setTextFontSize(40);
    setTextWeight("extrabold");
    setGridVisible(false);
    setNodes([templateNode]);

    showToast("Applied Template: Top Expert Stock Analysis", "success");
  };

  // --- ONE-CLICK COPY IMAGE TO CLIPBOARD ---
  const handleCopyToClipboard = async (boardToExport?: Board) => {
    const targetBoard = boardToExport || {
      id: activeBoardId,
      title,
      aspectRatio,
      selectedBg,
      customBgColor,
      shadowIntensity,
      paddingLevel,
      textAccent,
      textAccentColor,
      textOverlay,
      textPosition,
      textFontSize,
      textColor,
      textWeight,
      gridVisible,
      gridVariant,
      nodes,
    };

    if (targetBoard.nodes.length === 0) {
      showToast(`Please upload at least one screenshot to "${targetBoard.title}" first!`, "error");
      return;
    }

    const hasLiveEmbed = targetBoard.nodes.some(
      (n) => Boolean((n as any).isEmbed || n.data?.isEmbed) && !((n as any).screenshotUrl || n.data?.screenshotUrl)
    );
    if (hasLiveEmbed) {
      showToast('Live Figma embeds cannot be directly exported as static PNGs. Please click "Sync as Image" in the Figma tab or upload a static screenshot before copying.', "error");
      return;
    }

    const hasAnyScreenshot = targetBoard.nodes.some(
      (n) => Boolean((n as any).screenshotUrl || n.data?.screenshotUrl)
    );
    if (!hasAnyScreenshot) {
      showToast(`Please upload at least one screenshot to "${targetBoard.title}" before copying!`, "error");
      return;
    }

    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }

    setIsCopying(true);

    try {
      const nodesPayload = targetBoard.nodes.map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        width: n.width || 172,
        height: n.height || 364,
        isEmbed: Boolean((n as any).isEmbed || n.data?.isEmbed),
        screenshotUrl: (n as any).screenshotUrl || n.data?.screenshotUrl,
        deviceFrame: (n as any).deviceFrame || n.data?.deviceFrame,
        frameColor: (n as any).frameColor || n.data?.frameColor,
        tilt: (n as any).tilt || n.data?.tilt,
        screenFit: (n as any).screenFit || n.data?.screenFit || "cover",
        showIsland: (n as any).showIsland !== undefined ? (n as any).showIsland : n.data?.showIsland !== undefined ? n.data?.showIsland : true,
        selected: n.selected || false,
        zIndex: (n as any).zIndex || (n.selected ? 1000 : 0) + (Number(n.data?.customZIndex) || 0),
      }));

      const requestBody = {
        title: targetBoard.title.trim() || "My App Mockup",
        aspectRatio: targetBoard.aspectRatio || "16:9",
        background: targetBoard.selectedBg,
        customBgColor: targetBoard.customBgColor || null,
        shadowIntensity: targetBoard.shadowIntensity,
        paddingLevel: targetBoard.paddingLevel,
        textAccent: targetBoard.textAccent ? targetBoard.textAccent.trim() : null,
        textAccentColor: targetBoard.textAccentColor || null,
        textOverlay: targetBoard.textOverlay ? targetBoard.textOverlay.trim() : null,
        textPosition: targetBoard.textPosition,
        textFontSize: targetBoard.textFontSize,
        textColor: targetBoard.textColor || null,
        textWeight: targetBoard.textWeight,
        nodes: nodesPayload,
        screenshotUrl: nodesPayload[0]?.screenshotUrl || null,
        deviceFrame: nodesPayload[0]?.deviceFrame || null,
        tilt: nodesPayload[0]?.tilt || null,
      };

      const res = await fetch("/api/mockups/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed.");

      setMockupsList([data.mockup, ...mockupsList]);
      setUsageCount((prev) => prev + 1);

      // Fetch PNG as a blob and copy to clipboard
      const imageRes = await fetch(data.mockup.mockupUrl);
      const blob = await imageRes.blob();

      if (typeof navigator !== "undefined" && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        const item = new ClipboardItem({ [blob.type || "image/png"]: blob });
        await navigator.clipboard.write([item]);
        showToast("Mockup copied to clipboard! Paste directly into Slack, Figma, or X.", "success");
      } else {
        await handleDirectDownload(
          data.mockup.mockupUrl,
          `${targetBoard.title.replace(/\s+/g, "-").toLowerCase()}-mockup.png`
        );
        showToast("Clipboard image copy not supported by browser. Mockup downloaded!", "info");
      }
    } catch (err: any) {
      console.error("[Clipboard Error]:", err);
      showToast(err.message || "Failed to copy mockup image.", "error");
      if (err.message && (err.message.toLowerCase().includes("limit") || err.message.toLowerCase().includes("upgrade"))) {
        setShowLimitModal(true);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const handleDeleteMockup = async (mockupId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this generated mockup?")) return;

    try {
      const res = await fetch(`/api/mockups/delete?id=${mockupId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");

      setMockupsList((prev) => prev.filter((m) => m.id !== mockupId));
      showToast("Mockup deleted successfully!", "success");
    } catch (err: any) {
      console.error("Delete mockup error:", err);
      showToast(err.message || "Failed to delete mockup.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-12 text-left relative">
      
      {/* Sliding elegant Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border border-border-strong animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : toast.type === "info"
            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:opacity-80 ml-2 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upgrade Block Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-medium rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-foreground-pure mb-2">Upgrade Plan</h3>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Unlock higher monthly export limits (or unlimited exports), additional canvas screens, and premium style presets by upgrading your plan!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
              >
                View Pricing Plans
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full bg-foreground/[0.03] border border-border-medium hover:bg-foreground/[0.06] text-foreground-pure font-bold py-3 rounded-full text-sm active:scale-95 transition-all select-none cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek High-Fidelity Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-[#06080d]/85 backdrop-blur-xl z-[150] flex flex-col items-center justify-center p-4 md:p-6">
          <div className="bg-[#090b11]/95 border border-border-medium rounded-[32px] max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative backdrop-blur-md animate-scale-in">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            {/* Header */}
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-foreground/[0.01]">
              <div className="flex flex-col text-left gap-1">
                <h3 className="text-sm font-black tracking-widest text-foreground-pure uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  WYSIWYG Live Mockup Preview
                </h3>
                <p className="text-[10px] text-text-muted">
                  Cropped aspect ratio preview of "{title.trim() || "My App Mockup"}" before exporting.
                </p>
              </div>
              
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-foreground/[0.03] border border-border-medium text-text-dim hover:text-foreground-pure flex items-center justify-center hover:bg-foreground/[0.08] transition-all cursor-pointer"
                title="Close preview"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview Viewport Canvas */}
            <div 
              ref={previewContainerRef}
              className={`flex-1 p-8 bg-[#030407]/45 flex items-center justify-center min-h-0 relative ${
                zoomMode === "fit" ? "overflow-hidden" : "overflow-auto"
              }`}
            >
              {/* Floating Glassmorphic Zoom Control Pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#0c0f17]/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-xl select-none">
                {/* Auto-Fit Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setZoomMode("fit")}
                  className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    zoomMode === "fit"
                      ? "bg-indigo-500 text-white border-indigo-400"
                      : "bg-white/5 border-white/5 text-text-muted hover:text-foreground-pure hover:bg-white/10"
                  }`}
                >
                  Fit ({Math.round(fitScale * 100)}%)
                </button>
                
                {/* Separator */}
                <span className="w-px h-3.5 bg-white/15" />

                {/* Zoom Out Button */}
                <button
                  type="button"
                  onClick={() => {
                    setZoomMode("custom");
                    setCustomZoom(prev => Math.max(10, prev - 10));
                  }}
                  className="w-6 h-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 flex items-center justify-center text-text-muted hover:text-foreground-pure transition-all active:scale-90 cursor-pointer"
                  title="Zoom Out"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </button>

                {/* Slider */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={zoomMode === "fit" ? Math.round(fitScale * 100) : customZoom}
                    onChange={(e) => {
                      setZoomMode("custom");
                      setCustomZoom(parseInt(e.target.value));
                    }}
                    className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                    style={{
                      WebkitAppearance: 'none'
                    }}
                  />
                  <span className="text-[9px] font-black text-foreground-pure font-mono min-w-[28px] text-right">
                    {zoomMode === "fit" ? Math.round(fitScale * 100) : customZoom}%
                  </span>
                </div>

                {/* Zoom In Button */}
                <button
                  type="button"
                  onClick={() => {
                    setZoomMode("custom");
                    setCustomZoom(prev => Math.min(200, prev + 10));
                  }}
                  className="w-6 h-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 flex items-center justify-center text-text-muted hover:text-foreground-pure transition-all active:scale-90 cursor-pointer"
                  title="Zoom In"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {/* Exact scale wrapper layout for scrolling support and visual layout footprint */}
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: `${previewData.exportWidth * currentScale}px`,
                  height: `${previewData.exportHeight * currentScale}px`,
                  transition: "width 0.15s ease, height 0.15s ease",
                }}
              >
                <div 
                  className="relative shadow-2xl border border-white/5 overflow-hidden flex origin-top-left flex-shrink-0"
                  style={{
                    width: `${previewData.exportWidth}px`,
                    height: `${previewData.exportHeight}px`,
                    transform: `scale(${currentScale})`,
                    transformOrigin: "top left",
                    background: customBgColor || (BACKGROUND_PRESETS.find((b) => b.id === selectedBg)?.style || BACKGROUND_PRESETS[0].style),
                  }}
                >
                  {/* Presentational grid layer overlay */}
                  {gridVisible && (
                    <div
                      className="absolute inset-0 flex flex-wrap opacity-[0.06] pointer-events-none"
                    >
                      {Array.from({ length: Math.ceil((previewData.exportWidth * previewData.exportHeight) / 6400) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[80px] h-[80px] border-r border-b border-white"
                        />
                      ))}
                    </div>
                  )}

                  {/* Typography Headline Overlay */}
                  {(textOverlay || textAccent) && (
                    <div
                      className="absolute left-0 right-0 flex flex-col justify-center items-center z-40 px-6 text-center"
                      style={{
                        top: textPosition === "Top" ? `24px` : "auto",
                        bottom: textPosition === "Bottom" ? `24px` : "auto",
                      }}
                    >
                      {textAccent && (
                        <span
                          className="tracking-tight leading-tight select-none font-sans font-extrabold"
                          style={{
                            fontSize: `${Math.round(textFontSize * 0.9)}px`,
                            color: textAccentColor || "#f97316",
                          }}
                        >
                          {textAccent}
                        </span>
                      )}
                      {textOverlay && (
                        <span
                          className="tracking-tight leading-tight select-none font-sans"
                          style={{
                            fontSize: `${textFontSize}px`,
                            fontWeight: textWeight === "normal" ? 400 : textWeight === "medium" ? 500 : textWeight === "bold" ? 700 : 800,
                            color: textColor || (selectedBg === "white" || selectedBg === "candy" || selectedBg === "minimal-frost" ? "#000000" : "#ffffff"),
                            textShadow: (selectedBg === "white" || selectedBg === "candy" || selectedBg === "minimal-frost") ? "none" : "0 2px 10px rgba(0, 0, 0, 0.15)",
                          }}
                        >
                          {textOverlay}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Mockup nodes */}
                  {nodes.map((node) => {
                    const shiftedX = (node.position.x ?? 0) - previewData.minX + previewData.paddingLeft;
                    const shiftedY = (node.position.y ?? 0) - previewData.minY + previewData.paddingTop;

                    return (
                      <div
                        key={node.id}
                        className="absolute"
                        style={{
                          left: `${shiftedX}px`,
                          top: `${shiftedY}px`,
                          width: `${node.width || 172}px`,
                          height: `${node.height || 364}px`,
                        }}
                      >
                        <StaticDeviceMockup node={node} shadowIntensity={shadowIntensity} />
                      </div>
                    );
                  })}

                </div>
              </div>

            </div>

            {/* Footer Bar */}
            <div className="p-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-foreground/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
                  Dimensions: {previewData.exportWidth}px × {previewData.exportHeight}px (3x density scaling on export)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-5 py-2.5 rounded-full border border-border-medium hover:bg-foreground/[0.04] text-xs font-black text-foreground-pure transition-all select-none cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isCopying || isExporting}
                  onClick={async () => {
                    if (isLimitReached) {
                      setShowLimitModal(true);
                    } else {
                      await handleCopyToClipboard();
                    }
                  }}
                  className="px-5 py-2.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-black text-indigo-300 transition-all select-none cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Copy PNG directly to clipboard"
                >
                  {isCopying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                      <span>Copying...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => {
                    if (isLimitReached) {
                      setShowLimitModal(true);
                    } else {
                      setShowPreviewModal(false);
                      handleExport();
                    }
                  }}
                  className={`px-6 py-2.5 rounded-full text-xs font-black shadow-lg transition-all select-none cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isLimitReached
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:bg-rose-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-indigo-500/10 hover:shadow-indigo-500/20"
                  }`}
                >
                  {isLimitReached ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Upgrade to Export
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Design Now
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL — Collapsible Settings Accordion Sidebar (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 order-2 lg:order-1">
          
          {/* Filename Card */}
          <div className="border border-border-medium bg-bg-card/50 backdrop-blur-sm rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-foreground-pure">Mockup Project Filename</label>
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-saved</span>
              </div>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Landing Showcase Layout"
              className="w-full bg-foreground/[0.02] border border-border-medium text-foreground-pure rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Featured Showcase Templates Card */}
          <div className="border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-sm rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3 shadow-lg shadow-indigo-500/5">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground-pure">Featured Template</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                PRO PRESET
              </span>
            </div>

            <div className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl p-3">
              <div className="w-12 h-16 rounded-xl bg-gradient-to-b from-white to-sky-100 border border-black/10 overflow-hidden flex flex-col items-center justify-center p-1 shrink-0 shadow-sm relative">
                <div className="w-6 h-1 bg-amber-500 rounded-full mb-0.5" />
                <div className="w-7 h-1 bg-black rounded-full mb-1" />
                <div className="w-8 h-10 rounded-lg bg-black p-0.5 flex flex-col items-center">
                  <div className="w-3 h-0.5 bg-zinc-800 rounded-full mb-0.5" />
                  <div className="w-full flex-1 bg-zinc-900 rounded-[2px]" />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-foreground-pure leading-tight">Top Expert Stock Analysis</span>
                <span className="text-[10px] text-text-muted mt-0.5 leading-snug">
                  App Store portrait card with dual-color headline, minimal studio lighting &amp; dark market analysis feed.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={applyStockAnalysisTemplate}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/30 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span>Apply Stock Analysis Showcase</span>
            </button>
          </div>

          <div className="border border-border-medium bg-bg-card/50 backdrop-blur-sm rounded-3xl p-6 relative overflow-hidden flex flex-col gap-5">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
            
            <h3 className="text-sm font-extrabold text-foreground-pure mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Canvas Settings
            </h3>

            {/* Accordion 1: Uploads Hub */}
            <div className="border-b border-border-subtle pb-4">
              <button 
                onClick={() => toggleSection("uploads")}
                className="w-full flex items-center justify-between text-xs font-extrabold text-foreground-pure pb-2 cursor-pointer select-none"
              >
                <span>1. Upload Screens ({nodes.length} / {maxScreens})</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${openSections.uploads ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSections.uploads && (
                <div className="flex flex-col gap-3 mt-3 animate-fade-in">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 min-h-[110px] ${
                      isDragging 
                        ? "border-indigo-500 bg-indigo-500/5" 
                        : "border-border-medium hover:border-border-strong hover:bg-foreground/[0.01]"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-text-muted">Uploading to secure CDN...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-lg bg-foreground/[0.03] border border-border-medium flex items-center justify-center text-text-muted">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold text-foreground-pure">Add Draggable Mockup</span>
                        <span className="text-[9px] text-text-dim">Drag image or browse (Max 8MB)</span>
                      </div>
                    )}
                  </div>

                  {/* Quick-insert stock analysis template screen button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      takeSnapshot();
                      const { width: bWidth, height: bHeight } = getBoardDimensions(aspectRatio);
                      const is916 = aspectRatio === "9:16";
                      const nodeWidth = is916 ? 420 : 172;
                      const nodeHeight = is916 ? 884 : 364;
                      const newNode: Node = {
                        id: `node-${Date.now()}`,
                        type: "deviceMockup",
                        position: {
                          x: Math.round((bWidth - nodeWidth) / 2),
                          y: is916 ? 220 : Math.round((bHeight - nodeHeight) / 2),
                        },
                        width: nodeWidth,
                        height: nodeHeight,
                        data: {
                          deviceFrame: "iPhone 16 Pro",
                          frameColor: "Space Black",
                          tilt: "Flat",
                          shadowIntensity: "Soft",
                          screenshotUrl: "/templates/stock-analysis.png",
                          screenFit: "cover",
                          showIsland: false,
                          customZIndex: nodes.length + 1,
                        },
                      };
                      setNodes([...nodes, newNode]);
                      showToast("Added Stock Analysis Screen!", "success");
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.05] border border-border-medium hover:border-indigo-500/30 text-[10px] font-bold text-foreground-pure transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Insert Stock Analysis Screen</span>
                  </button>

                  {/* Figma Link Sync Input */}
                  <div className="border border-border-medium bg-bg-card/20 rounded-2xl p-4 flex flex-col gap-3 mt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {/* Figma Logo Accent Icon */}
                        <svg className="w-3 shrink-0" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: "12px" }}>
                          <path d="M19 0C8.5 0 0 8.5 0 19C0 24.3 2.2 29.1 5.7 32.5C2.2 35.9 0 40.7 0 46C0 56.5 8.5 65 19 65C29.5 65 38 56.5 38 46C38 40.7 35.8 35.9 32.3 32.5C35.8 29.1 38 24.3 38 19C38 8.5 29.5 0 19 0Z" fill="#F24E1E" style={{ display: "none" }} />
                          <path d="M9.5 28.5C4.25 28.5 0 24.25 0 19C0 13.75 4.25 9.5 9.5 9.5C14.75 9.5 19 13.75 19 19V28.5H9.5Z" fill="#F24E1E" />
                          <path d="M9.5 47.5C4.25 47.5 0 43.25 0 38C0 32.75 4.25 28.5 9.5 28.5H19V38C19 43.25 14.75 47.5 9.5 47.5Z" fill="#A259FF" />
                          <path d="M19 9.5C19 4.25 23.25 0 28.5 0C33.75 0 38 4.25 38 9.5C38 14.75 33.75 19 28.5 19H19V9.5Z" fill="#FF7262" />
                          <path d="M19 19H28.5C33.75 19 38 23.25 38 28.5C38 33.75 33.75 38 28.5 38C23.25 38 19 33.75 19 28.5V19Z" fill="#1ABC9C" />
                          <path d="M9.5 57C4.25 57 0 52.75 0 47.5C0 42.25 4.25 38 9.5 38C14.75 38 19 42.25 19 47.5C19 52.75 14.75 57 9.5 57Z" fill="#1982FC" />
                        </svg>
                        <span className="text-[10px] font-bold text-foreground-pure">Sync from Figma</span>
                      </div>

                      {/* Figma Sync Mode Tabs */}
                      <div className="flex bg-foreground/[0.04] border border-border-medium/60 p-0.5 rounded-lg text-[8px] font-bold shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSwitchSyncMode("static")}
                          className={`px-2 py-0.5 rounded-md transition-all text-center cursor-pointer ${
                            figmaSyncMode === "static" ? "bg-indigo-600 text-white shadow-sm" : "text-text-dim hover:text-text-muted"
                          }`}
                        >
                          Static
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchSyncMode("live")}
                          className={`px-2 py-0.5 rounded-md transition-all text-center cursor-pointer ${
                            figmaSyncMode === "live" ? "bg-indigo-600 text-white shadow-sm" : "text-text-dim hover:text-text-muted"
                          }`}
                        >
                          Interactive
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {figmaSyncMode === "static" ? (
                        <>
                          <input
                            type="text"
                            placeholder={figmaSyncRetrySeconds > 0 ? "Retrying automatically..." : "Paste Figma selection link..."}
                            value={figmaUrlInput}
                            onChange={(e) => setFigmaUrlInput(e.target.value)}
                            disabled={isSyncingFigma || figmaSyncRetrySeconds > 0}
                            className="flex-1 bg-foreground/[0.03] border border-border-medium rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-indigo-500/50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (figmaSyncRetrySeconds > 0) {
                                if (figmaSyncTimerRef.current) clearInterval(figmaSyncTimerRef.current);
                                figmaSyncTimerRef.current = null;
                                setFigmaSyncRetrySeconds(0);
                                setIsSyncingFigma(false);
                                showToast("Auto-retry cancelled.", "success");
                              } else {
                                handleSyncFigma();
                              }
                            }}
                            disabled={figmaSyncRetrySeconds === 0 && (isSyncingFigma || !figmaUrlInput.trim())}
                            className={`rounded-xl px-3 py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none active:scale-[0.98] ${
                              figmaSyncRetrySeconds > 0
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white"
                            }`}
                          >
                            {figmaSyncRetrySeconds > 0 ? (
                              <span className="flex items-center gap-1.5 animate-pulse text-amber-100">
                                <span className="w-2 h-2 rounded-full bg-amber-200 animate-ping" />
                                Retry ({figmaSyncRetrySeconds}s)
                              </span>
                            ) : isSyncingFigma ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Sync"
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Paste Figma selection or page link..."
                            value={figmaUrlInput}
                            onChange={(e) => setFigmaUrlInput(e.target.value)}
                            className="flex-1 bg-foreground/[0.03] border border-border-medium rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-indigo-500/50"
                          />
                          <button
                            type="button"
                            onClick={handleSyncFigma}
                            disabled={!figmaUrlInput.trim()}
                            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl px-3 py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none active:scale-[0.98]"
                          >
                            Sync Live
                          </button>
                        </>
                      )}
                    </div>
                    <span className="text-[8px] text-text-dim leading-normal">
                      Select frame in Figma, right click ➔ <strong>Copy link to selection</strong>.
                    </span>
                  </div>

                  {/* Active node lists list in accordion */}
                  {nodes.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-bold text-text-muted">Screens on Canvas:</span>
                      <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {nodes.map((node, i) => (
                          <div 
                            key={node.id} 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", JSON.stringify({
                                type: "moveMockup",
                                nodeId: node.id,
                                sourceBoardId: activeBoardId
                              }));
                            }}
                            onClick={() => {
                              // Highlight node
                              setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
                              setOpenSections((prev) => ({ ...prev, inspector: true }));
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-grab active:cursor-grabbing select-none transition-all ${
                              node.selected 
                                ? "bg-indigo-500/10 border-indigo-500/30 text-foreground-pure" 
                                : "bg-foreground/[0.01] border-border-medium hover:bg-foreground/[0.02]"
                            }`}
                          >
                            <div className="flex items-center gap-2 max-w-[85%]">
                              {/* Grab handle dots icon */}
                              <svg className="w-3.5 h-3.5 text-text-dim/50 cursor-grab flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                              </svg>

                              <span className="w-4 h-4 rounded bg-black/20 flex items-center justify-center overflow-hidden border border-border-medium flex-shrink-0">
                                <img src={node.data.screenshotUrl as string} className="object-cover h-full w-full" />
                              </span>
                              <span className="font-semibold text-[10px] truncate">
                                Screen {i + 1} ({String(node.data.deviceFrame || "")})
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              className="text-text-dim hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Device Node Inspector */}
            <div className="border-b border-border-subtle pb-4">
              <button 
                onClick={() => toggleSection("inspector")}
                className="w-full flex items-center justify-between text-xs font-extrabold text-foreground-pure pb-2 cursor-pointer select-none"
              >
                <span>2. Device Inspector</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${openSections.inspector ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSections.inspector && (
                <div className="mt-3 animate-fade-in">
                  {selectedNode ? (
                    <div className="flex flex-col gap-4">
                      {/* Active device frame */}
                      <div className="flex flex-col gap-2.5 text-left">
                        <label className="text-[10px] font-bold text-text-muted">Device Frame Model</label>

                        {/* Desktop & Web category */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Desktop & Web</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {DEVICE_FRAMES.filter((d) => d.category === "Desktop").map((d) => (
                              <button
                                key={d.id}
                                onClick={() => updateSelectedNode("deviceFrame", d.id)}
                                className={`py-2 px-2.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer flex items-center justify-between ${
                                  selectedNode.data.deviceFrame === d.id
                                    ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                    : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                                }`}
                              >
                                <span>{d.name}</span>
                                {d.id === "MacBook Pro" && <span className="text-[8px] opacity-60">16&quot;</span>}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Smartphones category */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Smartphones</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {DEVICE_FRAMES.filter((d) => d.category === "Mobile").map((d) => (
                              <button
                                key={d.id}
                                onClick={() => updateSelectedNode("deviceFrame", d.id)}
                                className={`py-2 px-2.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer text-left ${
                                  selectedNode.data.deviceFrame === d.id
                                    ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                    : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                                }`}
                              >
                                {d.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Active bezel color */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-text-muted">Bezel Finish Accent</label>
                        <div className="flex flex-wrap gap-1.5">
                          {FRAME_COLORS.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => updateSelectedNode("frameColor", c.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer ${
                                selectedNode.data.frameColor === c.id
                                  ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                  : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c.hex }} />
                              {c.name.split(" ").slice(-1)[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active presentation angle */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-text-muted">Node presentation angle</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ANGLES.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => updateSelectedNode("tilt", a.id)}
                              className={`p-2 rounded-xl border text-left active:scale-[0.98] transition-all flex flex-col gap-0.5 select-none cursor-pointer ${
                                selectedNode.data.tilt === a.id
                                  ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure"
                                  : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                              }`}
                            >
                              <span className={`font-bold text-[10px] ${selectedNode.data.tilt === a.id ? "text-indigo-400" : "text-foreground-pure"}`}>{a.name}</span>
                              <span className="text-[8px] text-text-dim leading-none">{a.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Screenshot Fit Mode */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-text-muted">Screenshot Fit Mode</label>
                          <span className="text-[8px] text-text-dim">
                            {(selectedNode.data.screenFit || "cover") === "contain" ? "Show Entire Screen" : "Fill Mockup Bezel"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateSelectedNode("screenFit", "cover")}
                            className={`py-1.5 px-2.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer text-center ${
                              (selectedNode.data.screenFit || "cover") === "cover"
                                ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                            }`}
                          >
                            Cover (Fill)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSelectedNode("screenFit", "contain")}
                            className={`py-1.5 px-2.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer text-center ${
                              selectedNode.data.screenFit === "contain"
                                ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                            }`}
                          >
                            Contain (Show All)
                          </button>
                        </div>
                      </div>

                      {/* Hardware Island / Notch Toggle (Smartphones) */}
                      {!isDesktopFrame(selectedNode.data.deviceFrame as string | undefined) && (
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-text-muted">Hardware Island / Notch</label>
                            <span className="text-[8px] text-text-dim">
                              {selectedNode.data.showIsland !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateSelectedNode("showIsland", true)}
                              className={`py-1.5 px-2.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer text-center ${
                                selectedNode.data.showIsland !== false
                                  ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                  : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                              }`}
                            >
                              Show Notch
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSelectedNode("showIsland", false)}
                              className={`py-1.5 px-2.5 rounded-xl border text-[10px] active:scale-[0.98] transition-all select-none cursor-pointer text-center ${
                                selectedNode.data.showIsland === false
                                  ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure font-bold"
                                  : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                              }`}
                            >
                              Hide Notch
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mockup Scale Presets & Slider */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-text-muted">
                            Mockup Width ({selectedNode.width || 172}px)
                          </label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => updateSelectedNodeDimensions(isDesktopFrame(selectedNode.data.deviceFrame as string | undefined) ? 480 : 172)}
                              className="px-2 py-0.5 rounded-md bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border-medium text-[8px] font-bold text-text-muted cursor-pointer active:scale-95"
                            >
                              Standard
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSelectedNodeDimensions(isDesktopFrame(selectedNode.data.deviceFrame as string | undefined) ? 720 : 420)}
                              className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[8px] font-bold text-indigo-400 cursor-pointer active:scale-95"
                            >
                              Hero
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={isDesktopFrame(selectedNode.data.deviceFrame as string | undefined) ? 280 : 120}
                          max={isDesktopFrame(selectedNode.data.deviceFrame as string | undefined) ? 900 : 560}
                          value={selectedNode.width || (isDesktopFrame(selectedNode.data.deviceFrame as string | undefined) ? 480 : 172)}
                          onChange={(e) => updateSelectedNodeDimensions(Number(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-foreground/[0.06] rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Depth Layer Stacking Controls */}
                      <div className="flex flex-col gap-1.5 text-left mb-2">
                        <label className="text-[10px] font-bold text-text-muted">Depth Ordering Layers</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={bringToFront}
                            className="bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border-medium text-foreground-pure text-[10px] font-extrabold py-2 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 select-none"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                            </svg>
                            Bring Front
                          </button>
                          <button
                            type="button"
                            onClick={sendToBack}
                            className="bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border-medium text-foreground-pure text-[10px] font-extrabold py-2 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 select-none"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                            </svg>
                            Send Back
                          </button>
                        </div>
                      </div>

                      {/* Dynamic aspect ratio auto-fitting button */}
                      {!!(selectedNode.data as any)?.screenshotUrl && (
                        <button
                          type="button"
                          onClick={fitSelectedNodeToAspectRatio}
                          disabled={isFittingAspect}
                          className="w-full bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 text-[10px] font-extrabold py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-98 select-none"
                        >
                          {isFittingAspect ? (
                            <>
                              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              Measuring & Fitting bezel...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                              </svg>
                              Auto-Fit Bezel Aspect Ratio
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete button in inspector */}
                      <button
                        onClick={() => deleteNode(selectedNode.id)}
                        className="w-full bg-rose-600/10 hover:bg-rose-600/15 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 text-[10px] font-extrabold py-2.5 rounded-xl cursor-pointer transition-colors"
                      >
                        Delete Screen Node
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-border-medium rounded-2xl bg-foreground/[0.01]">
                      <span className="text-[10px] text-text-dim font-medium leading-relaxed block px-4">
                        💡 Select a device mockup on the right canvas to inspect and configure its individual parameters!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 3: Backdrop Canvas */}
            <div className="border-b border-border-subtle pb-4">
              <button 
                onClick={() => toggleSection("backdrop")}
                className="w-full flex items-center justify-between text-xs font-extrabold text-foreground-pure pb-2 cursor-pointer select-none"
              >
                <span>3. Canvas Backdrop</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${openSections.backdrop ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSections.backdrop && (
                <div className="flex flex-col gap-3 mt-3 animate-fade-in">
                  
                  {/* Swatches preset grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {BACKGROUND_PRESETS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setSelectedBg(bg.id);
                          setCustomBgColor(""); // reset custom hex
                        }}
                        title={bg.name}
                        className={`aspect-square rounded-lg transition-all relative active:scale-90 flex items-center justify-center select-none cursor-pointer ${
                          selectedBg === bg.id && !customBgColor
                            ? "scale-105 ring-2 ring-indigo-500 ring-offset-2 ring-offset-background"
                            : "hover:scale-[1.02]"
                        }`}
                        style={{ background: bg.style }}
                      >
                        {selectedBg === bg.id && !customBgColor && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="flex flex-col gap-1.5 text-left border-t border-border-subtle pt-3">
                    <label className="text-[10px] font-bold text-text-muted">Custom Hex Background Color</label>
                    <div className="flex gap-2">
                      <div 
                        className="w-9 h-9 rounded-xl border border-border-strong flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: customBgColor || "#ffffff" }}
                      />
                      <input
                        type="text"
                        value={customBgColor}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value);
                          setSelectedBg(""); // reset preset selection
                        }}
                        placeholder="e.g. #3b82f6"
                        className="flex-1 bg-foreground/[0.02] border border-border-medium text-foreground-pure rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Accordion 4: Composition Controls */}
            <div className="border-b border-border-subtle pb-4">
              <button 
                onClick={() => toggleSection("composition")}
                className="w-full flex items-center justify-between text-xs font-extrabold text-foreground-pure pb-2 cursor-pointer select-none"
              >
                <span>4. Composition & Margins</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${openSections.composition ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSections.composition && (
                <div className="flex flex-col gap-4 mt-3 animate-fade-in">
                  
                  {/* Canvas Aspect Ratio */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-text-muted">Canvas Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "16:9", label: "16:9 Landscape" },
                        { id: "9:16", label: "9:16 Portrait" },
                        { id: "1:1", label: "1:1 Square" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            takeSnapshot();
                            setAspectRatio(item.id as any);
                          }}
                          className={`py-2 px-1.5 rounded-xl border text-[10px] font-bold active:scale-[0.98] transition-all select-none cursor-pointer text-center ${
                            aspectRatio === item.id
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-extrabold"
                              : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shadow levels */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-text-muted">Global Drop Shadow Intensity</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["None", "Soft", "Dramatic"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setShadowIntensity(level)}
                          className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold active:scale-[0.98] transition-all select-none cursor-pointer ${
                            shadowIntensity === level
                              ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure"
                              : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas padding presets */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-text-muted">Safety Padding Margins</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["Compact", "Standard", "Spacious"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setPaddingLevel(level)}
                          className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold active:scale-[0.98] transition-all select-none cursor-pointer ${
                            paddingLevel === level
                              ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure"
                              : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas alignment grids */}
                  <div className="flex flex-col gap-2 text-left border-t border-border-subtle pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-muted">Canvas Alignment Grid</label>
                      <button
                        onClick={() => setGridVisible(!gridVisible)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border select-none cursor-pointer transition-all ${
                          gridVisible
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : "bg-foreground/[0.02] border-border-medium text-text-muted"
                        }`}
                      >
                        {gridVisible ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    {gridVisible && (
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        {(["dots", "lines", "cross"] as const).map((variant) => (
                          <button
                            key={variant}
                            onClick={() => setGridVariant(variant)}
                            className={`py-1.5 rounded-lg border text-[9px] font-bold capitalize active:scale-[0.98] transition-all select-none cursor-pointer ${
                              gridVariant === variant
                                ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure"
                                : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                            }`}
                          >
                            {variant}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grid snapping toggle */}
                  <div className="flex flex-col gap-2 text-left border-t border-border-subtle pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-muted">Snap Mockups to Grid</label>
                      <button
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border select-none cursor-pointer transition-all ${
                          snapToGrid
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : "bg-foreground/[0.02] border-border-medium text-text-muted"
                        }`}
                      >
                        {snapToGrid ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Accordion 5: Typography Overlay */}
            <div>
              <button 
                onClick={() => toggleSection("text")}
                className="w-full flex items-center justify-between text-xs font-extrabold text-foreground-pure pb-2 cursor-pointer select-none"
              >
                <span>5. Typography Overlay</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${openSections.text ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSections.text && (
                <div className="flex flex-col gap-4 mt-3 animate-fade-in">
                  
                  {/* Category / Accent Text (e.g. "Top Expert") */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-muted">Top Accent Line (Optional)</label>
                      <span className="text-[9px] font-semibold text-text-dim">e.g. Featured tag</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textAccentColor || "#f97316"}
                        onChange={(e) => setTextAccentColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-border-strong flex-shrink-0 bg-transparent cursor-pointer"
                        title="Accent Line Color"
                      />
                      <input
                        type="text"
                        value={textAccent}
                        onChange={(e) => setTextAccent(e.target.value)}
                        placeholder="e.g. Top Expert, New Release"
                        className="flex-1 bg-foreground/[0.02] border border-border-medium text-foreground-pure rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
                      />
                      {textAccent && (
                        <button
                          type="button"
                          onClick={() => setTextAccent("")}
                          className="px-2.5 py-2 border border-border-medium hover:border-rose-500/30 text-text-muted hover:text-rose-400 rounded-xl text-[10px] transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-text-muted">Canvas Headline Text</label>
                    <input
                      type="text"
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      placeholder="e.g. Try our premium features today!"
                      className="w-full bg-foreground/[0.02] border border-border-medium text-foreground-pure rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-text-muted">Headline Position</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["Top", "Bottom"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setTextPosition(pos)}
                          className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold active:scale-[0.98] transition-all select-none cursor-pointer ${
                            textPosition === pos
                              ? "border-indigo-500 bg-indigo-500/5 text-foreground-pure"
                              : "border-border-medium bg-foreground/[0.01] hover:bg-foreground/[0.03] text-text-semi-muted"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size & Custom Color */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-border-subtle pt-3 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-muted">Size ({textFontSize}px)</label>
                      <input
                        type="range"
                        min="16"
                        max="64"
                        step="2"
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                        className="w-full h-1.5 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-muted">Weight</label>
                      <select
                        value={textWeight}
                        onChange={(e) => setTextWeight(e.target.value as any)}
                        className="w-full bg-foreground/[0.02] border border-border-medium text-foreground-pure rounded-xl px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                      >
                        <option value="normal" className="bg-background text-foreground">Regular</option>
                        <option value="medium" className="bg-background text-foreground">Medium</option>
                        <option value="bold" className="bg-background text-foreground">Bold</option>
                        <option value="extrabold" className="bg-background text-foreground">Extra Bold</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Text Color */}
                  <div className="flex flex-col gap-1.5 text-left border-t border-border-subtle pt-3">
                    <label className="text-[10px] font-bold text-text-muted">Custom Typography Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor || (isBgLight ? "#000000" : "#ffffff")}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-border-strong flex-shrink-0 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="Auto (contrast matched)"
                        className="flex-1 bg-foreground/[0.02] border border-border-medium text-foreground-pure rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50"
                      />
                      {textColor && (
                        <button
                          onClick={() => setTextColor("")}
                          className="px-2.5 py-2 border border-border-medium hover:border-rose-500/30 text-text-muted hover:text-rose-400 rounded-xl text-[10px] transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Usage Metres & Export Button */}
            <div className="border-t border-border-subtle pt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-text-muted">Quota Usage:</span>
                  <span className={`font-black ${isLimitReached ? "text-rose-400" : "text-indigo-400"}`}>
                    {userRole === "admin" ? (
                      "∞ (Admin Free Access)"
                    ) : (
                      `${usageCount} / ${plan === "free" ? "5" : plan === "starter" ? "30" : "∞"} exports used`
                    )}
                  </span>
                </div>
                {plan !== "pro" && userRole !== "admin" && (
                  <button
                    type="button"
                    onClick={() => setShowLimitModal(true)}
                    className="text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Upgrade Limit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <button
                  type="button"
                  disabled={nodes.length === 0}
                  onClick={() => setShowPreviewModal(true)}
                  className={`w-full font-extrabold text-xs py-3 rounded-2xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/5 text-foreground-pure transition-all active:scale-[0.98] select-none flex items-center justify-center gap-1.5 cursor-pointer ${
                    nodes.length === 0 ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  disabled={nodes.length === 0 || isCopying || isExporting || isLimitReached}
                  onClick={() => handleCopyToClipboard()}
                  className={`w-full font-extrabold text-xs py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all active:scale-[0.98] select-none flex items-center justify-center gap-1.5 cursor-pointer ${
                    nodes.length === 0 || isLimitReached ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                  title="Copy PNG directly to clipboard"
                >
                  {isCopying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                      <span>Copying...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy PNG</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                disabled={nodes.length === 0 || isExporting || isLimitReached}
                onClick={() => handleExport()}
                className={`w-full font-extrabold text-sm py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 select-none cursor-pointer ${
                  nodes.length === 0
                    ? "bg-foreground/5 text-text-muted border border-border-medium cursor-not-allowed"
                    : isLimitReached
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-not-allowed"
                      : isExporting
                        ? "bg-indigo-500/80 text-white cursor-wait"
                        : "bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]"
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Dynamic PNG...
                  </>
                ) : isLimitReached ? (
                  "Limit Reached — Upgrade to Export"
                ) : nodes.length === 0 ? (
                  "Upload Screenshots to Export"
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Premium PNG
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL — Multi-Screen Canva Stacked Slides Sandbox (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8 order-1 lg:order-2">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col text-left gap-1">
              <h3 className="text-sm font-black tracking-[0.08em] text-foreground-pure uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 animate-pulse" />
                Presentation Workspace Stack
              </h3>
              <p className="text-[11px] text-text-muted">
                Manage multiple slides in your presentation. Drag screens inside the active focused board.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Add Slide Header Button */}
              <button
                type="button"
                onClick={handleAddBoard}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/20 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-lg shadow-indigo-500/10 active:scale-95 transition-all cursor-pointer select-none"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Slide</span>
              </button>

              {boards.length > 1 && (
                <button
                  type="button"
                  disabled={isBulkExporting}
                  onClick={handleBulkExport}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 cursor-pointer disabled:opacity-50 select-none"
                >
                  {isBulkExporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                      <span>Bulk Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Bulk Export All ({boards.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {boards.map((board, index) => {
              const isActive = board.id === activeBoardId;
              const boardRatio = isActive ? aspectRatio : (board.aspectRatio || "16:9");
              const bDim = getBoardDimensions(boardRatio);
              const isLight = board.selectedBg === "white" || board.selectedBg === "candy" || isLightColor(board.customBgColor);
              const gridColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
              const bgStyle = board.customBgColor || BACKGROUND_PRESETS.find(bg => bg.id === board.selectedBg)?.style || BACKGROUND_PRESETS[0].style;

              return (
                <div 
                  key={board.id}
                  onClick={() => {
                    if (!isActive) {
                      setActiveBoardId(board.id);
                      hydrateLocalStates(board);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                      const rawData = e.dataTransfer.getData("text/plain");
                      if (rawData) {
                        const parsed = JSON.parse(rawData);
                        if (parsed.type === "moveMockup") {
                          const { nodeId, sourceBoardId } = parsed;
                          const destinationBoardId = board.id;
                          
                          if (sourceBoardId === destinationBoardId) return;
                          
                          const sourceBoard = boards.find(b => b.id === sourceBoardId);
                          if (!sourceBoard) return;
                          
                          const targetNode = sourceBoard.nodes.find(n => n.id === nodeId);
                          if (!targetNode) return;
                          
                          const destBoard = boards.find(b => b.id === destinationBoardId);
                          if (destBoard && destBoard.nodes.length >= maxScreens) {
                            showToast(`Destination board has reached the maximum of ${maxScreens} screens!`, "error");
                            return;
                          }
                          
                          setBoards(prev => prev.map(b => {
                            if (b.id === sourceBoardId) {
                              return {
                                ...b,
                                nodes: b.nodes.filter(n => n.id !== nodeId)
                              };
                            }
                            if (b.id === destinationBoardId) {
                              return {
                                ...b,
                                nodes: [...b.nodes, { ...targetNode, selected: true }]
                              };
                            }
                            return b;
                          }));
                          
                          if (isActive) {
                            setNodes(prev => prev.filter(n => n.id !== nodeId));
                          }
                          
                          setActiveBoardId(destinationBoardId);
                          const updatedDestBoard = {
                            ...destBoard,
                            nodes: [...(destBoard?.nodes || []).map(n => ({...n, selected: false})), { ...targetNode, selected: true }]
                          } as Board;
                          hydrateLocalStates(updatedDestBoard);
                          
                          showToast(`Moved screen to "${board.title}"!`, "success");
                          return;
                        }
                      }
                    } catch (err) {
                      console.error("Error handling mockup drop:", err);
                    }
                    
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      await processImageUploadsForBoard(files, board.id);
                    }
                  }}
                  className={`border bg-bg-card/45 backdrop-blur-sm rounded-3xl p-4 md:p-6 relative overflow-hidden flex flex-col gap-4 transition-all duration-300 ${
                    isActive 
                      ? "border-indigo-500/80 shadow-[0_0_40px_rgba(99,102,241,0.12)] ring-1 ring-indigo-500/30" 
                      : "border-border-medium hover:border-border-strong hover:scale-[1.002] cursor-pointer"
                  }`}
                >
                  {/* Card Header Top Border Highlight */}
                  <div className={`absolute top-0 inset-x-0 h-[2px] transition-opacity duration-300 ${isActive ? "bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500" : "bg-transparent"}`} />

                  {/* Slide Management Top Bar Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border-subtle/30">
                    <div className="flex items-center gap-3">
                      {/* Slide Number Tag */}
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-xs">
                        {index + 1}
                      </div>

                      {/* Editable Board Title Input */}
                      <input
                        type="text"
                        value={board.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBoards((prev) => prev.map((b) => (b.id === board.id ? { ...b, title: val } : b)));
                          if (isActive) setTitle(val);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Name your board..."
                        className="bg-transparent border-0 border-b border-transparent hover:border-border-medium focus:border-indigo-500 focus:ring-0 font-extrabold text-foreground-pure text-xs p-0 pb-0.5 rounded-none transition-all w-48 focus:outline-none"
                      />

                      {isActive && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Editing
                        </span>
                      )}
                    </div>

                    {/* Board Slide Action Toolbar */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Reordering Actions */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveBoardUp(index)}
                        className="p-1.5 rounded-lg bg-foreground/[0.02] border border-border-medium hover:bg-foreground/[0.06] text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Slide Up"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      
                      <button
                        type="button"
                        disabled={index === boards.length - 1}
                        onClick={() => handleMoveBoardDown(index)}
                        className="p-1.5 rounded-lg bg-foreground/[0.02] border border-border-medium hover:bg-foreground/[0.06] text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Slide Down"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div className="w-px h-4 bg-border-medium mx-1" />

                      {/* Duplicate Action */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateBoard(board)}
                        className="p-1.5 rounded-lg bg-foreground/[0.02] border border-border-medium hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 text-text-muted transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Duplicate Slide"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        <span className="hidden sm:inline">Duplicate</span>
                      </button>

                      {/* Delete Action */}
                      <button
                        type="button"
                        disabled={boards.length <= 1}
                        onClick={() => handleDeleteBoard(board.id)}
                        className="p-1.5 rounded-lg bg-foreground/[0.02] border border-border-medium hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-text-muted transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Delete Slide"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>

                      <div className="w-px h-4 bg-border-medium mx-1" />

                      {/* Single Copy Action */}
                      <button
                        type="button"
                        disabled={board.nodes.length === 0 || isCopying || isExporting}
                        onClick={() => handleCopyToClipboard(board)}
                        className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                          board.nodes.length === 0
                            ? "bg-foreground/5 text-text-muted border-border-medium cursor-not-allowed"
                            : "bg-indigo-500/5 border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-indigo-400"
                        }`}
                        title="Copy PNG to Clipboard"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span className="hidden sm:inline">Copy</span>
                      </button>

                      {/* Single Download Action */}
                      <button
                        type="button"
                        disabled={board.nodes.length === 0 || isExporting}
                        onClick={() => handleExport(board)}
                        className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-black ${
                          board.nodes.length === 0
                            ? "bg-foreground/5 text-text-muted border-border-medium cursor-not-allowed"
                            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                        }`}
                        title="Download PNG for this slide"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>

                  {/* STUDIO POLISH TOOLBAR (Active Board Only) */}
                  {isActive && (
                    <div className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2 rounded-2xl bg-bg-card/90 backdrop-blur-md border border-border-subtle shadow-sm select-none">
                      {/* 1. History Engine (Undo / Redo) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!canUndo}
                          onClick={handleUndo}
                          className="px-2.5 py-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                          title="Undo (Ctrl+Z / Cmd+Z)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2a5 5 0 01-5 5H11" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6L3 10l4 4" />
                          </svg>
                          <span className="hidden sm:inline">Undo</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canRedo}
                          onClick={handleRedo}
                          className="px-2.5 py-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2a5 5 0 005 5h2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l4 4-4 4" />
                          </svg>
                          <span className="hidden sm:inline">Redo</span>
                        </button>
                      </div>

                      <div className="w-px h-4 bg-border-medium hidden md:block" />

                      {/* 2. Smart Alignment & Distribution */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-dim mr-1 hidden lg:inline">Align:</span>
                        
                        <button
                          type="button"
                          disabled={nodes.length === 0}
                          onClick={alignCenterH}
                          className="p-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Center Horizontally (Canvas)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M7 8h10M5 16h14" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={nodes.length === 0}
                          onClick={alignCenterV}
                          className="p-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Center Vertically (Canvas)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M8 7v10M16 5v14" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={nodes.length < 2}
                          onClick={alignTops}
                          className="p-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Align Tops"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M7 8v10M17 8v6" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={nodes.length < 2}
                          onClick={alignBottoms}
                          className="p-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Align Bottoms"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M7 16V6M17 16v-6" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={nodes.length < 2}
                          onClick={distributeEvenly}
                          className="p-1.5 rounded-xl border border-border-medium hover:border-indigo-500/30 hover:bg-indigo-500/10 text-text-muted hover:text-foreground-pure transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Distribute Evenly Across Canvas"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16M20 4v16M10 8v8M14 8v8" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={nodes.length === 0}
                          onClick={autoCascade}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:to-pink-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="1-Click Auto Layout: Hero Centered, Isometric Duo, or Launch Trio"
                        >
                          <svg className="w-3 h-3 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Auto Cascade</span>
                        </button>
                      </div>

                      <div className="w-px h-4 bg-border-medium hidden md:block" />

                      {/* Canvas Aspect Ratio Switcher */}
                      <div className="flex items-center gap-1 bg-foreground/[0.03] p-0.5 rounded-xl border border-border-medium">
                        {(["16:9", "9:16", "1:1"] as const).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                              aspectRatio === ratio
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-text-muted hover:text-foreground-pure hover:bg-foreground/[0.04]"
                            }`}
                            title={`Switch to ${ratio === "16:9" ? "Landscape (16:9)" : ratio === "9:16" ? "Portrait (9:16)" : "Square (1:1)"}`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>

                      <div className="w-px h-4 bg-border-medium hidden md:block" />

                      {/* 3. Quick Copy to Clipboard */}
                      <button
                        type="button"
                        disabled={nodes.length === 0 || isCopying || isExporting}
                        onClick={() => handleCopyToClipboard()}
                        className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
                        title="Copy PNG directly to clipboard"
                      >
                        {isCopying ? (
                          <>
                            <div className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                            <span>Copying...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>Copy PNG</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Scaled Responsive Canvas Container */}
                  <div 
                    ref={isActive ? containerRef : undefined}
                    className={`w-full ${
                      boardRatio === "9:16"
                        ? "max-w-[480px] mx-auto aspect-[9/16]"
                        : boardRatio === "1:1"
                        ? "max-w-[650px] mx-auto aspect-square"
                        : "aspect-[16/9]"
                    } rounded-2xl overflow-hidden transition-all duration-500 relative select-none border border-border-medium bg-black/10 ${!isActive ? "hover:shadow-md transition-shadow group" : ""}`}
                    style={{ background: bgStyle }}
                  >
                    {isActive ? (
                      // ACTIVE BOARD — Live Bounded React Flow Sandbox
                      !mounted ? (
                        <div className="w-full h-full bg-[#030303] flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div 
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: bDim.width,
                            height: bDim.height,
                            transform: `scale(${scale})`,
                            transformOrigin: "top left"
                          }}
                        >
                          {nodes.length === 0 && (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-foreground/[0.01] hover:bg-foreground/[0.02] transition-colors p-8 z-[80]"
                            >
                              <div className="bg-[#090b11]/95 border border-indigo-500/20 rounded-[32px] p-8 flex flex-col items-center gap-4.5 shadow-2xl max-w-sm text-center select-none active:scale-[0.98] transition-transform backdrop-blur-md">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <h4 className="text-sm font-black text-foreground-pure uppercase tracking-widest">Add Mockup to this Slide</h4>
                                  <p className="text-[10px] text-text-dim leading-relaxed max-w-[260px]">
                                    Drag & drop any app screenshot directly onto this board, or click this card to browse files!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          <ReactFlowProvider>
                            <ReactFlow
                              nodes={nodesWithZIndex}
                              onNodesChange={(changes) => {
                                onNodesChange(changes);
                              }}
                              onNodeDragStart={() => {
                                takeSnapshot();
                              }}
                              nodeTypes={nodeTypes}
                              snapToGrid={snapToGrid}
                              snapGrid={[12, 12]}
                              fitView={false}
                              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                              minZoom={1}
                              maxZoom={1}
                              panOnScroll={false}
                              zoomOnScroll={false}
                              zoomOnPinch={false}
                              panOnDrag={false}
                              preventScrolling={true}
                              className="w-full h-full"
                            >
                              {/* Grid background layer */}
                              {gridVisible && (
                                <Background 
                                  variant={
                                    gridVariant === "dots" 
                                      ? BackgroundVariant.Dots 
                                      : gridVariant === "lines" 
                                      ? BackgroundVariant.Lines 
                                      : BackgroundVariant.Cross
                                  } 
                                  size={1.5} 
                                  gap={24}
                                  color="var(--grid-line)"
                                  style={{ opacity: 0.12 }}
                                />
                              )}

                              {/* Text Overlay inside sandbox */}
                              {(textOverlay || textAccent) && (
                                <div 
                                  className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-50 px-6"
                                  style={{
                                    top: textPosition === "Top" ? 40 : "auto",
                                    bottom: textPosition === "Bottom" ? 40 : "auto",
                                  }}
                                >
                                  {textAccent && (
                                    <span
                                      className="tracking-wide uppercase font-black drop-shadow-sm select-none text-center mb-1.5"
                                      style={{
                                        fontSize: `${Math.max(12, Math.round(textFontSize * 0.45))}px`,
                                        color: textAccentColor || "#f97316",
                                        letterSpacing: "0.15em",
                                      }}
                                    >
                                      {textAccent}
                                    </span>
                                  )}
                                  {textOverlay && (
                                    <span 
                                      className="tracking-tight drop-shadow-md select-none text-center leading-none"
                                      style={{
                                        fontSize: `${textFontSize}px`,
                                        fontWeight: textWeight === "normal" ? 400 : textWeight === "medium" ? 500 : textWeight === "bold" ? 700 : 800,
                                        color: textColor || (isBgLight ? "#000000" : "#ffffff"),
                                      }}
                                    >
                                      {textOverlay}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Inset Safety Padding Presets Guidance Border */}
                              <div 
                                className="absolute rounded-xl border border-dashed border-white/5 pointer-events-none transition-all duration-300"
                                style={{
                                  inset: paddingLevel === "Compact" ? "20px" : paddingLevel === "Spacious" ? "80px" : "48px",
                                  opacity: 0.5
                                }}
                              />
                            </ReactFlow>
                          </ReactFlowProvider>

                          {/* Live Canvas Watermark for Free Plan users (exempting Admins) */}
                          {plan === "free" && userRole !== "admin" && (
                            <div 
                              className="absolute bottom-6 right-6 z-[100] pointer-events-none select-none flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md animate-fade-in"
                              style={{
                                backgroundColor: "rgba(15, 23, 42, 0.45)",
                              }}
                            >
                              <img 
                                src="/logo.png" 
                                alt="Muckly Logo" 
                                className="w-5 h-5 rounded-md border border-white/10 shadow-md object-cover mr-2"
                              />
                              <span className="text-[10px] font-black tracking-[0.12em] text-white uppercase font-sans">
                                Muckly
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <InactiveBoardCanvas
                        board={board}
                        isLight={isLight}
                        gridColor={gridColor}
                        plan={plan}
                        userRole={userRole}
                      />
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="flex items-center gap-1.5 justify-center border border-border-subtle bg-foreground/[0.01] rounded-2xl px-4 py-2">
                      <span className="text-[10px] text-text-dim leading-none text-center">
                        👉 Click a screen to select & configure bezel finish or presentation tilt details. Drag mockups to arrange them freely on the active canvas!
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Board Slide Trigger */}
            <button
              type="button"
              onClick={handleAddBoard}
              className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all rounded-3xl p-8 flex flex-col items-center justify-center gap-3 group cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-indigo-500/5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="text-xs font-black text-foreground-pure transition-colors group-hover:text-indigo-400 uppercase tracking-widest">
                + Add New Board Slide Page
              </h4>
              <p className="text-[10px] text-text-muted leading-normal max-w-sm">
                Insert a clean, separate Canva slide board stacked below to upload and arrange more screenshots.
              </p>
            </button>
          </div>
        </div>

      </div>

      {/* Mockup Gallery */}
      <div className="border-t border-border-subtle pt-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-left">
          <h3 className="text-base font-extrabold text-foreground-pure">Mockup Gallery</h3>
          <p className="text-xs text-text-muted">View and download your past generated mockups.</p>
        </div>

        {mockupsList.length === 0 ? (
          <div className="border border-dashed border-border-medium rounded-3xl p-10 text-center flex flex-col items-center justify-center bg-foreground/[0.01]">
            <svg className="w-8 h-8 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            <h4 className="text-xs font-bold text-foreground-pure mb-1">No exported mockups yet</h4>
            <p className="text-[10px] text-text-muted max-w-xs leading-normal">
              Any mockup you generate will be permanently hosted and shown here for instant download access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockupsList.map((m) => (
              <div 
                key={m.id}
                className="border border-border-medium bg-bg-card/40 rounded-2xl overflow-hidden flex flex-col hover:border-border-strong hover:scale-[1.01] transition-all relative group"
              >
                {/* 100% Fidelity Thumbnail - renders compiled high-res PNG directly */}
                <div className="aspect-[16/9] w-full relative overflow-hidden bg-black/10 border-b border-border-subtle flex items-center justify-center">
                  {m.mockupUrl ? (
                    <img 
                      src={m.mockupUrl} 
                      alt={m.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" 
                    />
                  ) : (
                    <div className="text-text-dim text-[10px] font-semibold italic">No Thumbnail</div>
                  )}
                </div>

                {/* Footer info logs */}
                <div className="p-4 flex items-center justify-between text-xs text-left bg-foreground/[0.01]">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-foreground-pure tracking-tight line-clamp-1">{m.title}</span>
                    <span className="text-[9px] text-text-muted">
                      {m.deviceFrame || "Multi-screen"} • {m.tilt || "Custom Layout"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {m.mockupUrl && (
                      <button
                        onClick={() => handleDirectDownload(
                          m.mockupUrl!,
                          `${m.title.replace(/\s+/g, "-").toLowerCase()}-mockup.png`
                        )}
                        className="p-2 rounded-xl bg-foreground/[0.03] border border-border-medium hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 text-foreground-pure transition-all active:scale-95 flex items-center justify-center select-none cursor-pointer"
                        title="Download to computer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteMockup(m.id)}
                      className="p-2 rounded-xl bg-foreground/[0.03] border border-border-medium hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-foreground-pure transition-all active:scale-95 flex items-center justify-center select-none cursor-pointer"
                      title="Delete mockup"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
