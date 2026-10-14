"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";

const faqs = [
  {
    question: "How does Muckly automate the framing process?",
    answer: "Muckly detects your screenshot's aspect ratio and instantly wraps it in a perfect vector outline of your chosen device. No heavy graphics software or manual alignment required."
  },
  {
    question: "What backgrounds and styling options are available?",
    answer: "Choose from deep solids, premium linear gradients (like Sunset Glow and Cosmic Aurora), or high-fidelity blurred mesh backdrops. You can also customize your own backdrop colors to perfectly complement your app's brand."
  },
  {
    question: "What mobile device frames are available?",
    answer: "Muckly supports a curated collection of premium mobile frames, including the latest iPhone 17 Pro, iPhone 16 Pro, Google Pixel 9 Pro, Samsung Galaxy S24, and Sony Xperia 1 VI. All frames are fully customizable with multiple titanium and color finishes."
  },
  {
    question: "Is there a commercial license included with Pro?",
    answer: "Yes, every mockup generated on a Pro account comes with an unrestricted commercial license. You can use your exports for App Store submittals, client presentations, ads, and templates."
  }
];

export default function MarketingPage() {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [isLoadingStarter, setIsLoadingStarter] = useState(false);
  const [isLoadingPro, setIsLoadingPro] = useState(false);

  const handleUpgradeClick = async (e: React.MouseEvent, selectedPlan: "starter" | "pro") => {
    if (!session) {
      // User is not logged in, proceed to signup/signin
      return;
    }

    e.preventDefault();
    if (selectedPlan === "starter") {
      setIsLoadingStarter(true);
    } else {
      setIsLoadingPro(true);
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          billingPeriod: billingPeriod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session.");
      }

      // Redirect immediately to secure Dodo Payments portal
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during checkout initialization.");
      setIsLoadingStarter(false);
      setIsLoadingPro(false);
    }
  };

  // Playground customize states
  const [device, setDevice] = useState<"iphone" | "pixel" | "samsung">("iphone");
  const [gradient, setGradient] = useState<"sunset" | "aurora" | "midnight" | "lavender">("sunset");
  const [isTilted, setIsTilted] = useState(true);
  const [gridVisible, setGridVisible] = useState(false);
  const [gridStyle, setGridStyle] = useState<"dots" | "lines" | "cross">("dots");
  const [textOverlay, setTextOverlay] = useState("Design beautifully.");
  const [textFontSize, setTextFontSize] = useState(28);
  const [textWeight, setTextWeight] = useState<"normal" | "medium" | "bold" | "extra-bold">("bold");
  const [textColor, setTextColor] = useState("");
  const [textPosition, setTextPosition] = useState<"Top" | "Bottom">("Top");

  const isBgLight = false;


  // FAQ Accordion states
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-foreground/10 selection:text-foreground-pure transition-colors duration-300">
      
      {/* Background Decorative Glow Blobs */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1000px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 transition-all duration-500" 
        style={{
          background: "radial-gradient(circle, var(--glow-blob-1) 0%, var(--glow-blob-2) 40%, transparent 80%)"
        }}
      />
      <div 
        className="absolute top-[35%] right-[-10%] w-[50vw] max-w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500" 
        style={{
          background: "radial-gradient(circle, var(--glow-blob-3) 0%, transparent 70%)"
        }}
      />
      <div 
        className="absolute bottom-[10%] left-[-10%] w-[50vw] max-w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500" 
        style={{
          background: "radial-gradient(circle, var(--glow-blob-2) 0%, transparent 70%)"
        }}
      />

      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-300" 
        style={{
          backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: "48px 48px"
        }}
      />

      <Navbar />

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 pt-10">
        
        {/* Hero Section */}
        <section className="pt-20 pb-20 md:pt-28 md:pb-32 flex flex-col items-center text-center">
          {/* Subtle Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border-medium bg-bg-card px-3.5 py-1 text-xs text-text-muted mb-6 backdrop-blur-sm animate-fade-in transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Now supporting iPhone 16 & Pixel 9 frames</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground-pure max-w-4xl leading-[1.08] mb-6">
            Your app mockups <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              made easy
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed mb-10">
            Transform raw, dull mobile app emulator screenshots into premium, publication-ready device presentations in seconds. Elevate your App Store visuals, product launches, and developer portfolios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm mb-20">
            <a 
              id="cta-get-started-free"
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-full px-8 py-3.5 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200"
            >
              Get started free
            </a>
            <a 
              id="cta-see-examples"
              href="#playground"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold border border-border-medium bg-bg-card hover:bg-bg-card-hover text-foreground-pure rounded-full px-8 py-3.5 transition-all duration-200"
            >
              Interactive Demo
            </a>
          </div>

          {/* Interactive Customizer Preview Playground */}
          <div 
            id="playground" 
            className="w-full max-w-5xl rounded-3xl border border-border-subtle bg-bg-card backdrop-blur-sm shadow-2xl relative overflow-hidden flex flex-col lg:flex-row group"
          >
            {/* Top decorative glass effect bar */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent z-10" />

            {/* Glowing accent behind device frame */}
            <div className="absolute top-1/2 left-1/2 lg:left-2/3 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[90px] opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />

            {/* Left Control Sidebar */}
            <div className="flex flex-col gap-6 w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border-subtle p-6 md:p-8 bg-foreground/[0.02] z-10 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Playground</span>
                <h3 className="text-lg font-bold text-foreground-pure mb-4">Customize Mockup</h3>
              </div>

              {/* 1. Device Frame Selector */}
              <div>
                <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2.5">1. Select Device Frame</h4>
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                  <button 
                    onClick={() => setDevice("iphone")}
                    className={`flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-98 cursor-pointer ${
                      device === "iphone" 
                        ? "bg-foreground text-background shadow-md font-bold" 
                        : "bg-bg-card border border-border-subtle text-text-semi-muted hover:text-foreground-pure hover:bg-bg-card-hover"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>iPhone 16 Pro</span>
                  </button>
                  <button 
                    onClick={() => setDevice("pixel")}
                    className={`flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-98 cursor-pointer ${
                      device === "pixel" 
                        ? "bg-foreground text-background shadow-md font-bold" 
                        : "bg-bg-card border border-border-subtle text-text-semi-muted hover:text-foreground-pure hover:bg-bg-card-hover"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Pixel 9 Pro</span>
                  </button>
                  <button 
                    onClick={() => setDevice("samsung")}
                    className={`flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-98 cursor-pointer ${
                      device === "samsung" 
                        ? "bg-foreground text-background shadow-md font-bold" 
                        : "bg-bg-card border border-border-subtle text-text-semi-muted hover:text-foreground-pure hover:bg-bg-card-hover"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    <span>Samsung S24</span>
                  </button>
                </div>
              </div>

              {/* 2. Background Selector */}
              <div>
                <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2.5">2. Choose Background</h4>
                <div className="grid grid-cols-4 gap-2.5">
                  <button 
                    onClick={() => setGradient("sunset")}
                    className={`w-full aspect-square rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-indigo-600 relative transition-all duration-200 active:scale-95 cursor-pointer ${
                      gradient === "sunset" ? "ring-2 ring-foreground scale-105" : "border border-border-subtle hover:scale-105"
                    }`}
                    title="Sunset Gradient"
                  />
                  <button 
                    onClick={() => setGradient("aurora")}
                    className={`w-full aspect-square rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 relative transition-all duration-200 active:scale-95 cursor-pointer ${
                      gradient === "aurora" ? "ring-2 ring-foreground scale-105" : "border border-border-subtle hover:scale-105"
                    }`}
                    title="Aurora Borealis"
                  />
                  <button 
                    onClick={() => setGradient("midnight")}
                    className={`w-full aspect-square rounded-xl bg-gradient-to-br from-indigo-950 via-slate-950 to-[#020617] relative transition-all duration-200 active:scale-95 cursor-pointer ${
                      gradient === "midnight" ? "ring-2 ring-foreground scale-105" : "border border-border-subtle hover:scale-105"
                    }`}
                    title="Midnight Depth"
                  />
                  <button 
                    onClick={() => setGradient("lavender")}
                    className={`w-full aspect-square rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] relative transition-all duration-200 active:scale-95 cursor-pointer ${
                      gradient === "lavender" ? "ring-2 ring-foreground scale-105" : "border border-border-subtle hover:scale-105"
                    }`}
                    title="Midnight Lavender"
                  />
                </div>
              </div>

              {/* 3. 3D Angle Switcher */}
              <div>
                <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2.5">3. Angle & Tilt</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsTilted(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isTilted 
                        ? "bg-foreground text-background shadow-md font-bold" 
                        : "bg-bg-card border border-border-subtle text-text-semi-muted hover:text-foreground-pure"
                    }`}
                  >
                    3D Perspective
                  </button>
                  <button 
                    onClick={() => setIsTilted(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      !isTilted 
                        ? "bg-foreground text-background shadow-md font-bold" 
                        : "bg-bg-card border border-border-subtle text-text-semi-muted hover:text-foreground-pure"
                    }`}
                  >
                    Flat View
                  </button>
                </div>
              </div>

              {/* 4. Canvas Alignment Grid */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider">4. Alignment Grid</h4>
                  <button 
                    onClick={() => setGridVisible(!gridVisible)}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                      gridVisible 
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400" 
                        : "border-border-medium text-text-dim hover:text-foreground-pure"
                    }`}
                  >
                    {gridVisible ? "Enabled" : "Disabled"}
                  </button>
                </div>
                {gridVisible && (
                  <div className="grid grid-cols-3 gap-1.5 animate-fade-in">
                    {(["dots", "lines", "cross"] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setGridStyle(style)}
                        className={`py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all cursor-pointer ${
                          gridStyle === style
                            ? "bg-foreground text-background font-black shadow-md"
                            : "bg-bg-card border border-border-subtle text-text-semi-muted hover:text-foreground-pure"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Typography Text Overlay */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider">5. Typography Title</h4>
                <input
                  type="text"
                  placeholder="Headline overlay..."
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-input text-xs text-foreground placeholder-text-dim focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10 transition-all"
                />
                
                {textOverlay && (
                  <div className="flex flex-col gap-3 animate-fade-in pl-1">
                    {/* Position Toggle */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-text-dim">Position</span>
                      <div className="flex gap-1.5">
                        {(["Top", "Bottom"] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setTextPosition(pos)}
                            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer font-bold ${
                              textPosition === pos
                                ? "bg-foreground text-background"
                                : "text-text-muted hover:text-foreground-pure"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-text-dim">Font Size</span>
                        <span className="font-bold text-foreground-pure">{textFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-border-medium rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Font Weight */}
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[10px] font-semibold text-text-dim">Font Weight</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(["normal", "medium", "bold", "extra-bold"] as const).map((weight) => (
                          <button
                            key={weight}
                            onClick={() => setTextWeight(weight)}
                            className={`py-1 rounded text-[8px] font-bold uppercase transition-all cursor-pointer truncate ${
                              textWeight === weight
                                ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400"
                                : "bg-bg-card border border-border-subtle text-text-dim hover:text-foreground-pure"
                            }`}
                          >
                            {weight === "normal" ? "Reg" : weight === "medium" ? "Med" : weight === "bold" ? "Bld" : "Ext"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Text Color */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-text-dim">Text Color</span>
                      <div className="flex gap-2 items-center">
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-border-subtle shrink-0">
                          <input
                            type="color"
                            value={textColor || (isBgLight ? "#000000" : "#ffffff")}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-none p-0 bg-transparent"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Auto Contrast"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-[10px] font-mono rounded-lg border border-border-subtle bg-bg-input text-foreground focus:outline-none focus:border-indigo-500/40"
                        />
                        {textColor && (
                          <button
                            onClick={() => setTextColor("")}
                            className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 px-1 py-0.5 cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Live Viewport Canvas */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 min-h-[480px] relative overflow-hidden bg-foreground/[0.02] z-0 transition-colors">
              {/* Subtle canvas grid pattern */}
              <div 
                className="absolute inset-0 pointer-events-none transition-all duration-300" 
                style={{
                  backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
                  backgroundSize: "32px 32px"
                }}
              />

              {/* Presentation canvas frame */}
              <div 
                className={`w-full max-w-2xl aspect-[16/10] rounded-2xl flex items-center justify-center p-6 md:p-8 shadow-2xl relative transition-all duration-500 overflow-hidden ${
                  gradient === "sunset" 
                    ? "bg-gradient-to-br from-pink-500 via-rose-500 to-indigo-600" 
                    : gradient === "aurora"
                    ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600"
                    : gradient === "midnight"
                    ? "bg-gradient-to-br from-indigo-950 via-slate-950 to-[#020617] border border-border-subtle"
                    : "bg-gradient-to-br from-[#667eea] to-[#764ba2]"
                }`}
              >
                {/* Visual Glassmorphic glows inside canvas */}
                <div className="absolute top-[-20%] left-[-20%] w-[65%] h-[65%] bg-white/20 rounded-full blur-[80px] pointer-events-none" />

                {/* Canvas Grid Overlay */}
                {gridVisible && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-40 transition-all duration-300"
                    style={{
                      backgroundImage: 
                        gridStyle === "dots"
                          ? theme === "dark" 
                            ? "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)" 
                            : "radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)"
                          : gridStyle === "lines"
                          ? theme === "dark"
                            ? "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)"
                            : "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)"
                          : theme === "dark"
                          ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 9v6M9 12h6' stroke='rgba(255,255,255,0.12)' stroke-width='1'/%3E%3C/svg%3E\")"
                          : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 9v6M9 12h6' stroke='rgba(0,0,0,0.12)' stroke-width='1'/%3E%3C/svg%3E\")",
                      backgroundSize: "24px 24px"
                    }}
                  />
                )}

                {/* Typography Title Overlay */}
                {textOverlay && (
                  <div 
                    className="absolute left-0 right-0 flex justify-center pointer-events-none z-20 px-6"
                    style={{
                      top: textPosition === "Top" ? "10%" : "auto",
                      bottom: textPosition === "Bottom" ? "10%" : "auto",
                    }}
                  >
                    <span 
                      className="tracking-tight drop-shadow-md select-none text-center leading-none max-w-md"
                      style={{
                        fontSize: `${textFontSize}px`,
                        fontWeight: textWeight === "normal" ? 400 : textWeight === "medium" ? 500 : textWeight === "bold" ? 700 : 800,
                        color: textColor || (isBgLight ? "#000000" : "#ffffff"),
                      }}
                    >
                      {textOverlay}
                    </span>
                  </div>
                )}

                {/* Device Frame Wrapper with dynamic perspective transformations */}
                <div 
                  className="w-full flex flex-col items-center justify-center transition-all duration-500 ease-out z-10"
                  style={{
                    transform: isTilted 
                      ? "perspective(1200px) rotateX(12deg) rotateY(-12deg) rotateZ(3deg)"
                      : "none"
                  }}
                >
                  {/* iOS or Android Phone Frame */}
                  {(device === "iphone" || device === "pixel" || device === "samsung") && (
                    <div 
                      className={`w-full max-w-[200px] sm:max-w-[220px] aspect-[9/19.5] shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative transition-all duration-500 overflow-hidden flex flex-col ${
                        device === "iphone"
                          ? "rounded-[40px] border-[5px] border-zinc-800 bg-[#0d0d11] p-1.5"
                          : device === "pixel"
                          ? "rounded-[34px] border-[5px] border-zinc-700 bg-[#0a0a0c] p-1.5"
                          : "rounded-[36px] border-[5px] border-zinc-800 bg-[#0c0d12] p-1.5"
                      }`}
                    >
                      {/* iPhone Dynamic Island */}
                      {device === "iphone" && (
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black z-30 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 ml-auto mr-1.5" />
                        </div>
                      )}

                      {/* Pixel Notch */}
                      {device === "pixel" && (
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black z-30 flex items-center justify-center border border-zinc-800" />
                      )}

                      {/* Samsung Notch */}
                      {device === "samsung" && (
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-black z-30 flex items-center justify-center border border-zinc-900" />
                      )}

                      {/* Phone Screen Mock Interface */}
                      <div 
                        className={`flex-1 overflow-hidden relative flex flex-col p-3 transition-all duration-500 ${
                          device === "iphone" 
                            ? "rounded-[32px]" 
                            : device === "pixel" 
                            ? "rounded-[26px]" 
                            : "rounded-[28px]"
                        } bg-[#050508] text-white`}
                      >
                        {/* Status bar */}
                        <div className="flex justify-between items-center w-full z-20 px-1 pt-1 select-none">
                          <span className="text-[9px] font-bold text-white/90 tracking-tight">9:41</span>
                          <div className="flex gap-1.5 items-center">
                            {/* Cellular */}
                            <div className="flex gap-[0.5px] items-end h-2">
                              <div className="w-[1px] h-1 bg-white rounded-2xs" />
                              <div className="w-[1px] h-1.5 bg-white rounded-2xs" />
                              <div className="w-[1px] h-2 bg-white rounded-2xs" />
                              <div className="w-[1px] h-2.5 bg-white/40 rounded-2xs" />
                            </div>
                            {/* Wifi */}
                            <svg className="w-2.5 h-2.5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.11 12.4a3 3 0 014.24 0M5.29 9.58a7 7 0 019.9 0M12 15.25h.01" />
                            </svg>
                            {/* Battery */}
                            <div className="w-4 h-2 border border-white/60 rounded-2xs p-[0.5px] flex items-center justify-start relative">
                              <div className="w-[10px] h-full bg-white rounded-3xs" />
                              <div className="w-[1.5px] h-[3px] bg-white/60 rounded-r-2xs absolute -right-[2px]" />
                            </div>
                          </div>
                        </div>

                        {/* Fintech App Header */}
                        <div className="flex justify-between items-center w-full mt-2 px-1 z-20 select-none">
                          <div className="flex items-center gap-1.5">
                            {/* User profile avatar */}
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-black text-white shadow-md border border-white/10 ring-1 ring-white/5">
                              GC
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-[6px] text-white/40 uppercase font-semibold tracking-wider">Welcome</span>
                              <span className="text-[9px] font-bold text-white leading-none -mt-[1px]">Gabriel C.</span>
                            </div>
                          </div>
                          {/* Notification bell */}
                          <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer relative shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1 right-1 border border-black animate-pulse" />
                          </div>
                        </div>

                        {/* Wallet Gradient Card */}
                        <div className="w-full mt-2.5 rounded-2xl p-3 bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#a855f7] shadow-[0_8px_20px_rgba(79,70,229,0.25)] relative overflow-hidden flex flex-col justify-between border border-white/20 select-none">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-md pointer-events-none" />
                          
                          <div className="flex justify-between items-start z-10">
                            <div className="flex flex-col text-left">
                              <span className="text-[6px] text-white/60 uppercase font-semibold tracking-wider">Total balance</span>
                              <span className="text-sm font-extrabold text-white leading-none mt-1 tracking-tight">$14,250.84</span>
                            </div>
                            <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/20 text-emerald-300 text-[6px] font-bold flex items-center gap-0.5">
                              <svg className="w-1.5 h-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              <span>+8.4%</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-end mt-3.5 z-10">
                            <div className="flex flex-col text-left font-mono">
                              <span className="text-[7px] text-white/80 tracking-widest">**** 8842</span>
                              <span className="text-[5px] text-white/50 uppercase tracking-wider mt-0.5">Gabriel Chipaya</span>
                            </div>
                            <div className="flex gap-1 items-center">
                              <div className="w-4 h-3 bg-amber-400/80 rounded-2xs border border-white/10 flex flex-col gap-0.5 p-[1px] justify-between">
                                <div className="w-full h-[0.5px] bg-black/10 rounded-3xs" />
                                <div className="w-full h-[0.5px] bg-black/10 rounded-3xs" />
                              </div>
                              <div className="flex -space-x-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-500/90" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions Row */}
                        <div className="grid grid-cols-4 gap-2 w-full mt-2.5 px-1 z-20 select-none">
                          {[
                            { label: "Send", color: "from-blue-500 to-indigo-500", icon: (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0v12m0-12L4 20" />
                              </svg>
                            )},
                            { label: "Receive", color: "from-emerald-500 to-teal-500", icon: (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 17H4m0 0V5m0 12l16-16" />
                              </svg>
                            )},
                            { label: "Stocks", color: "from-purple-500 to-pink-500", icon: (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            )},
                            { label: "Bills", color: "from-amber-500 to-orange-500", icon: (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            )}
                          ].map((action, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 cursor-pointer">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md active:scale-95 transition-all`}>
                                {action.icon}
                              </div>
                              <span className="text-[7px] text-white/50 font-medium tracking-tight">{action.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Mini Performance Graph */}
                        <div className="w-full mt-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-2 relative z-20 select-none text-left">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Weekly performance</span>
                            <span className="text-[8px] font-bold text-emerald-400">+14.2%</span>
                          </div>
                          
                          <div className="w-full h-11 relative mt-1">
                            <div className="absolute inset-x-0 top-0 h-px border-t border-dashed border-white/[0.04]" />
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-white/[0.04]" />
                            <div className="absolute inset-x-0 bottom-0 h-px border-t border-dashed border-white/[0.04]" />
                            
                            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <path d="M 0 30 L 0 18 Q 15 10 30 15 T 60 8 T 85 18 T 100 12 L 100 30 Z" fill="url(#chart-grad)" />
                              <path d="M 0 18 Q 15 10 30 15 T 60 8 T 85 18 T 100 12" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                              <circle cx="60" cy="8" r="1.5" fill="#f43f5e" />
                            </svg>
                          </div>
                        </div>

                        {/* Recent Transactions Feed */}
                        <div className="w-full mt-2.5 flex-1 flex flex-col justify-start z-20 select-none text-left overflow-hidden">
                          <div className="flex justify-between items-center mb-1 px-0.5">
                            <span className="text-[8px] font-bold text-white/80">Activity log</span>
                            <span className="text-[7px] font-bold text-indigo-400 hover:underline cursor-pointer">See all</span>
                          </div>
                          
                          <div className="flex flex-col gap-1 overflow-hidden">
                            {[
                              { name: "Stripe transfer", time: "2m ago", amt: "+$2,450.00", icon: (
                                <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                              ), amtColor: "text-emerald-400" },
                              { name: "Figma Pro Suite", time: "1h ago", amt: "-$15.00", icon: (
                                <div className="w-4.5 h-4.5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </div>
                              ), amtColor: "text-white/85" },
                              { name: "Vercel hosting", time: "Yesterday", amt: "-$20.00", icon: (
                                <div className="w-4.5 h-4.5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </div>
                              ), amtColor: "text-white/85" }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center rounded-xl bg-white/[0.01] hover:bg-white/[0.03] p-1 border border-white/[0.04] transition-colors">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  {item.icon}
                                  <div className="flex flex-col text-left truncate">
                                    <span className="text-[7.5px] font-bold text-white/95 leading-none truncate">{item.name}</span>
                                    <span className="text-[5.5px] text-white/40 mt-0.5">{item.time}</span>
                                  </div>
                                </div>
                                <span className={`text-[7.5px] font-extrabold ${item.amtColor} shrink-0`}>{item.amt}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Frosted Bottom Navigation Bar Capsule */}
                        <div className="w-full mt-auto pt-1 z-20 select-none">
                          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl py-0.5 px-2.5 flex justify-between items-center">
                            {[
                              { active: true, icon: (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 3L4 9v12h16V9l-8-6zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                                </svg>
                              )},
                              { icon: (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                </svg>
                              )},
                              { icon: (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )},
                              { icon: (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                </svg>
                              )}
                            ].map((tab, idx) => (
                              <button key={idx} className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                                tab.active ? "text-indigo-400 bg-white/[0.04]" : "text-white/40 hover:text-white/80"
                              }`}>
                                {tab.icon}
                                {tab.active && <span className="w-0.5 h-0.5 rounded-full bg-indigo-400 mt-0.5" />}
                              </button>
                            ))}
                          </div>
                          
                          {/* Grab Bar Indicator */}
                          <div className="w-10 h-0.5 bg-white/20 rounded-full mx-auto mt-1.5" />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 border-t border-border-subtle relative transition-all">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">The Workflow</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground-pure mb-4">
              Pristine mockups in three simple steps
            </h3>
            <p className="text-text-muted leading-relaxed text-base">
              Say goodbye to opening heavy design files, adjusting perspectives manually, or rendering templates. Muckly automates your device framing process instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="rounded-2xl border border-border-subtle bg-bg-card hover:bg-bg-card-hover hover:border-indigo-500/20 hover:shadow-[0_10px_35px_rgba(99,102,241,0.06)] hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-foreground-pure mb-3">1. Upload Screenshot</h4>
              <p className="text-text-muted leading-relaxed text-sm flex-1">
                Drag and drop your raw Android or iOS emulator screenshots directly into the browser. We accept standard, high-resolution PNG, JPG, and WebP formats automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-border-subtle bg-bg-card hover:bg-bg-card-hover hover:border-purple-500/20 hover:shadow-[0_10px_35px_rgba(168,85,247,0.06)] hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-purple-500/20 transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-foreground-pure mb-3">2. Choose Device Frame</h4>
              <p className="text-text-muted leading-relaxed text-sm flex-1">
                Select your preferred presentation layout. Wrap your screens in pixel-perfect iPhone 17 Pro, Google Pixel 9 Pro, or Samsung Galaxy S24 frames. Customize background gradients and 3D tilts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-border-subtle bg-bg-card hover:bg-bg-card-hover hover:border-pink-500/20 hover:shadow-[0_10px_35px_rgba(236,72,153,0.06)] hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col h-full group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-foreground-pure mb-3">3. Export Mockup</h4>
              <p className="text-text-muted leading-relaxed text-sm flex-1">
                Download pristine, high-resolution PNG mockups with a beautiful gradient, mesh, or solid background in 1-click. Ready to post directly on Dribbble, Twitter, or upload to the App Store.
              </p>
            </div>

          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 border-t border-border-subtle relative transition-all">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Plans & Pricing</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground-pure mb-4">
              Simple, transparent pricing
            </h3>
            <p className="text-text-muted leading-relaxed text-base mb-8">
              Get started with our completely free tier, select a budget Starter plan, or unlock unlimited exports with Pro.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-foreground/[0.03] border border-border-medium rounded-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-2 rounded-full transition-all cursor-pointer select-none ${
                  billingPeriod === "monthly"
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10"
                    : "text-text-muted hover:text-foreground-pure"
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("annual")}
                className={`px-4 py-2 rounded-full transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  billingPeriod === "annual"
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10"
                    : "text-text-muted hover:text-foreground-pure"
                }`}
              >
                Annual billing
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500 text-white leading-none">
                  Save 33%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
            
            {/* Free Plan */}
            <div className="rounded-3xl border border-border-subtle bg-bg-card p-8 flex flex-col justify-between relative overflow-hidden group transition-all">
              <div>
                <h4 className="text-xl font-bold text-foreground-pure mb-2">Free Plan</h4>
                <p className="text-sm text-text-dim mb-6">For casual makers and designers.</p>
                <div className="flex items-baseline gap-1 text-foreground-pure mb-8">
                  <span className="text-4xl md:text-5xl font-extrabold">$0</span>
                  <span className="text-sm text-text-dim">/ month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>5 exports per month</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Standard mobile device frames</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Solid color backgrounds</span>
                  </li>
                </ul>
              </div>

              {session ? (
                <Link 
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center text-sm font-semibold border border-border-medium hover:bg-bg-card-hover text-foreground-pure rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <a 
                  id="pricing-free-cta"
                  href="/sign-up"
                  className="w-full inline-flex items-center justify-center text-sm font-semibold border border-border-medium hover:bg-bg-card-hover text-foreground-pure rounded-xl py-3 active:scale-[0.98] transition-all duration-200"
                >
                  Get started free
                </a>
              )}
            </div>

            {/* Starter Plan */}
            <div className="rounded-3xl border border-border-subtle bg-bg-card p-8 flex flex-col justify-between relative overflow-hidden group transition-all">
              <div>
                <h4 className="text-xl font-bold text-foreground-pure mb-2">Starter Plan</h4>
                <p className="text-sm text-text-dim mb-6">For indie makers and creators.</p>
                <div className="flex items-baseline gap-1 text-foreground-pure mb-8">
                  <span className="text-4xl md:text-5xl font-extrabold">
                    {billingPeriod === "annual" ? "$3" : "$4"}
                  </span>
                  <span className="text-sm text-text-dim">/ month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-foreground-pure">30 exports per month</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Standard mobile device frames</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Solid & gradient backgrounds</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-foreground-pure">No watermarks</span>
                  </li>
                </ul>
              </div>

              {session ? (
                session.user.role === "admin" ? (
                  <Link 
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center text-sm font-semibold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    Admin Access (Active)
                  </Link>
                ) : session.user.plan === "starter" ? (
                  <Link 
                    href="/settings/billing"
                    className="w-full inline-flex items-center justify-center text-sm font-semibold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    Manage Subscription
                  </Link>
                ) : (
                  <button 
                    onClick={(e) => handleUpgradeClick(e, "starter")}
                    disabled={isLoadingStarter}
                    className="w-full inline-flex items-center justify-center text-sm font-semibold border border-border-medium hover:bg-bg-card-hover text-foreground-pure rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingStarter ? "Loading..." : "Upgrade to Starter"}
                  </button>
                )
              ) : (
                <Link 
                  id="pricing-starter-cta"
                  href={`/sign-up?plan=starter&period=${billingPeriod}`}
                  className="w-full inline-flex items-center justify-center text-sm font-semibold border border-border-medium hover:bg-bg-card-hover text-foreground-pure rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Upgrade to Starter
                </Link>
              )}
            </div>

            {/* Pro Plan */}
            <div className="rounded-3xl border-2 border-indigo-500/30 bg-bg-card p-8 flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-indigo-500/[0.04] transition-all">
              {/* Featured Badge */}
              <div className="absolute top-4 right-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Most Popular
              </div>

              <div>
                <h4 className="text-xl font-bold text-foreground-pure mb-2">Pro Plan</h4>
                <p className="text-sm text-text-dim mb-6">For professional designers and creators.</p>
                <div className="flex items-baseline gap-1 text-foreground-pure mb-8">
                  <span className="text-4xl md:text-5xl font-extrabold">
                    {billingPeriod === "annual" ? "$6" : "$9"}
                  </span>
                  <span className="text-sm text-text-dim">/ month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-foreground-pure">Unlimited exports</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>All premium mobile frames</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Custom background gradients & 3D tilt angles</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-text-semi-muted">
                    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>No watermarks & HD clean exports</span>
                  </li>
                </ul>
              </div>

              {session ? (
                session.user.role === "admin" ? (
                  <Link 
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center text-sm font-semibold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    Admin Access (Active)
                  </Link>
                ) : session.user.plan === "pro" ? (
                  <Link 
                    href="/settings/billing"
                    className="w-full inline-flex items-center justify-center text-sm font-semibold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 rounded-xl py-3 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    Manage Subscription
                  </Link>
                ) : (
                  <button 
                    onClick={(e) => handleUpgradeClick(e, "pro")}
                    disabled={isLoadingPro}
                    className="w-full inline-flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl py-3 shadow-lg shadow-indigo-500/25 hover:opacity-90 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingPro ? "Loading..." : "Upgrade to Pro"}
                  </button>
                )
              ) : (
                <Link 
                  id="pricing-pro-cta"
                  href={`/sign-up?plan=pro&period=${billingPeriod}`}
                  className="w-full inline-flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl py-3 shadow-lg shadow-indigo-500/25 hover:opacity-90 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>

          </div>
        </section>

        {/* Elegant FAQ Section */}
        <section id="faq" className="py-24 border-t border-border-subtle relative transition-all">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">FAQ</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground-pure mb-4">
              Got Questions?
            </h3>
            <p className="text-text-muted leading-relaxed text-base">
              Everything you need to know about Muckly's automated mockup design framework.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden transition-all duration-300 hover:border-border-strong"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full py-6 px-8 flex justify-between items-center text-left text-foreground-pure hover:bg-bg-card-hover transition-all duration-200 cursor-pointer"
                  >
                    <span className="font-semibold text-base pr-4">{faq.question}</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full bg-bg-card-active border border-border-medium shrink-0 text-text-dim transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-foreground-pure border-border-strong bg-bg-card-active" : ""
                    }`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  
                  {/* Dynamic Height Disclosure Area */}
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[200px] border-t border-border-subtle" : "max-h-0"
                    }`}
                  >
                    <div className="p-8 text-sm text-text-muted leading-relaxed bg-foreground/[0.01]">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 mb-20 rounded-3xl border border-border-subtle bg-gradient-to-r from-indigo-500/[0.03] via-purple-500/[0.03] to-transparent flex flex-col items-center text-center p-8 md:p-16 relative overflow-hidden transition-all">
          <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground-pure mb-4">Ready to elevate your app presentation?</h3>
          <p className="text-text-muted max-w-xl mb-8 text-sm md:text-base">Start wrapping your screenshots in premium mockups instantly. No credit card required to test drive the free features.</p>
          <a 
            id="banner-cta"
            href="/sign-up" 
            className="inline-flex items-center justify-center text-sm font-semibold bg-foreground text-background hover:opacity-95 active:scale-[0.98] transition-all duration-200 rounded-full px-8 py-3.5 shadow-xl"
          >
            Create Your First Mockup
          </a>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-[var(--header-bg-scrolled)] relative z-10 py-16 transition-colors">
        <div className="mx-auto max-w-7xl px-6 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Muckly Logo" 
                width={24} 
                height={24} 
                className="rounded-md object-cover border border-border-subtle"
              />
              <span className="text-lg font-bold tracking-tight text-foreground-pure">Muckly</span>
            </div>
            <p className="text-xs text-text-dim max-w-xs leading-relaxed">
              Instantly transform raw screenshots into high-end, customizable device mockups. Made for builders, designers, and creators worldwide.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6 text-xs text-text-muted">
            <a href="#features" className="hover:text-foreground-pure transition-colors duration-150">Features</a>
            <a href="#playground" className="hover:text-foreground-pure transition-colors duration-150">Playground</a>
            <a href="#pricing" className="hover:text-foreground-pure transition-colors duration-150">Pricing</a>
            <a href="/support" className="hover:text-foreground-pure transition-colors duration-150">Support</a>
            <a href="/terms" className="hover:text-white transition-colors duration-150">Terms of Service</a>
            <a href="/privacy" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
          </div>

        </div>

        <div className="mx-auto max-w-7xl px-6 md:px-8 mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-text-dim">
          <div>&copy; {new Date().getFullYear()} Muckly Inc. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Built by</span>
              <a 
                href="https://barakis.com/" 
                className="text-text-muted hover:text-indigo-400 font-medium transition-colors duration-150 border-b border-border-medium hover:border-indigo-400 pb-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Barakis
              </a>
            </div>
            <span className="text-text-dim/40">|</span>
            <div className="flex items-center gap-1.5">
              <span>Powered by</span>
              <a 
                href="https://www.techadotech.com/" 
                className="text-text-muted hover:text-indigo-400 font-medium transition-colors duration-150 border-b border-border-medium hover:border-indigo-400 pb-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Techado Tech
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
