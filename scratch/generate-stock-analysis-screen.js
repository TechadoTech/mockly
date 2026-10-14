const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 780 x 1690 matching iPhone 16 Pro display ratio
const width = 780;
const height = 1690;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090a0f" />
      <stop offset="100%" stop-color="#050608" />
    </linearGradient>

    <linearGradient id="dockGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#181c2b" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0d101a" stop-opacity="0.98" />
    </linearGradient>

    <linearGradient id="avatarGrad1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6" /><stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="avatarGrad2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8b5cf6" /><stop offset="100%" stop-color="#6d28d9" />
    </linearGradient>
    <linearGradient id="avatarGrad3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06b6d4" /><stop offset="100%" stop-color="#0e7490" />
    </linearGradient>
    <linearGradient id="avatarGrad4" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b" /><stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="avatarGrad5" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10b981" /><stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
  </defs>

  <style>
    .status-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 26px; font-weight: 700; fill: #ffffff; }
    .nav-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 32px; font-weight: 700; fill: #ffffff; text-anchor: middle; letter-spacing: -0.3px; }
    .tab-active { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 26px; font-weight: 700; fill: #ffffff; }
    .tab-inactive { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 26px; font-weight: 500; fill: #64748b; }
    .article-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 25px; font-weight: 600; fill: #f8fafc; letter-spacing: -0.3px; }
    .author-meta { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 20px; font-weight: 400; fill: #94a3b8; }
    .ticker-symbol { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 18px; font-weight: 700; }
    .ticker-val-up { fill: #22c55e; }
    .ticker-val-down { fill: #ef4444; }
    .dock-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; font-weight: 600; fill: #94a3b8; text-anchor: middle; }
    .dock-label-active { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; font-weight: 700; fill: #38bdf8; text-anchor: middle; }
  </style>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- iOS Status Bar & Dynamic Island Safe Area -->
  <g transform="translate(0, 0)">
    <!-- Time -->
    <text x="68" y="88" class="status-text">9:41</text>

    <!-- Dynamic Island -->
    <rect x="265" y="54" width="250" height="68" rx="34" fill="#000000" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    <circle cx="480" cy="88" r="7" fill="#111827" stroke="rgba(37,99,235,0.4)" stroke-width="1.5" />
    <circle cx="481" cy="87" r="2" fill="rgba(255,255,255,0.4)" />
    <circle cx="305" cy="88" r="5" fill="#0b0f19" />

    <!-- Status Icons: Signal, WiFi, Battery -->
    <g transform="translate(640, 68)">
      <rect x="0" y="16" width="4" height="8" rx="1" fill="#ffffff" />
      <rect x="7" y="12" width="4" height="12" rx="1" fill="#ffffff" />
      <rect x="14" y="7" width="4" height="17" rx="1" fill="#ffffff" />
      <rect x="21" y="2" width="4" height="22" rx="1" fill="#ffffff" />

      <rect x="35" y="5" width="32" height="16" rx="4" fill="none" stroke="#ffffff" stroke-width="2" />
      <rect x="38" y="8" width="21" height="10" rx="2" fill="#ffffff" />
      <path d="M 68 10 L 68 16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    </g>
  </g>

  <!-- App Header (Analysis & Opinion) -->
  <g transform="translate(0, 168)">
    <!-- Back Button -->
    <circle cx="68" cy="32" r="28" fill="#141722" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
    <path d="M 72 22 L 62 32 L 72 42" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />

    <!-- Center Title -->
    <text x="${width / 2}" y="42" class="nav-title">Analysis &amp; Opinion</text>

    <!-- Search Button -->
    <circle cx="${width - 68}" cy="32" r="28" fill="#141722" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
    <path d="M ${width - 73} 27 A 6 6 0 1 1 ${width - 61} 27 A 6 6 0 1 1 ${width - 73} 27 M ${width - 63} 31 L ${width - 57} 37" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none" />
  </g>

  <!-- Tab Bar -->
  <g transform="translate(42, 268)">
    <text x="0" y="0" class="tab-active">Most Popular</text>
    <rect x="0" y="16" width="158" height="4" rx="2" fill="#ffffff" />

    <text x="225" y="0" class="tab-inactive">Latest Analysis</text>
    <line x1="-42" y1="18" x2="${width - 42}" y2="18" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
  </g>

  <!-- Article 1: 9 Tech Stocks (David Wagner) -->
  <g transform="translate(42, 335)">
    <circle cx="46" cy="46" r="46" fill="url(#avatarGrad1)" />
    <circle cx="46" cy="34" r="16" fill="#f8fafc" />
    <path d="M 22 75 Q 46 50 70 75 Z" fill="#cbd5e1" />
    <g transform="translate(115, 34)">
      <text x="0" y="0" class="article-title">9 Tech Stocks Still Trading Below</text>
      <text x="0" y="32" class="article-title">Fair Value After the US-Iran Deal</text>
      <text x="0" y="72" class="author-meta">David Wagner <tspan fill="#64748b">•</tspan> 10 h ago  <tspan fill="#64748b">💬 2</tspan></text>
      <g transform="translate(0, 110)">
        <rect x="0" y="0" width="285" height="38" rx="19" fill="#141722" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <text x="16" y="25" class="ticker-symbol"><tspan fill="#94a3b8">XAU/USD</tspan> <tspan class="ticker-val-up">+0.71%</tspan> <tspan fill="#94a3b8">GC</tspan> <tspan class="ticker-val-up">+0.21%</tspan></text>
      </g>
    </g>
  </g>

  <line x1="42" y1="545" x2="${width - 42}" y2="545" stroke="rgba(255,255,255,0.07)" stroke-width="1" />

  <!-- Article 2: US Retail Sales (Damian Chmiel) -->
  <g transform="translate(42, 575)">
    <circle cx="46" cy="46" r="46" fill="url(#avatarGrad2)" />
    <circle cx="46" cy="34" r="16" fill="#f8fafc" />
    <path d="M 22 75 Q 46 50 70 75 Z" fill="#cbd5e1" />
    <g transform="translate(115, 34)">
      <text x="0" y="0" class="article-title">US Retail Sales and CPI Numbers</text>
      <text x="0" y="32" class="article-title">Point to an Impending Market Reversal</text>
      <text x="0" y="72" class="author-meta">Damian Chmiel <tspan fill="#64748b">•</tspan> 10 h ago  <tspan fill="#64748b">💬 5</tspan></text>
      <g transform="translate(0, 110)">
        <rect x="0" y="0" width="325" height="38" rx="19" fill="#141722" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <text x="16" y="25" class="ticker-symbol"><tspan fill="#94a3b8">EUR/USD</tspan> <tspan class="ticker-val-down">-0.34%</tspan> <tspan fill="#94a3b8">USD/JPY</tspan> <tspan class="ticker-val-up">+0.42%</tspan></text>
      </g>
    </g>
  </g>

  <line x1="42" y1="785" x2="${width - 42}" y2="785" stroke="rgba(255,255,255,0.07)" stroke-width="1" />

  <!-- Article 3: S&P 500 Peak (Pinchas Cohen) -->
  <g transform="translate(42, 815)">
    <circle cx="46" cy="46" r="46" fill="url(#avatarGrad3)" />
    <circle cx="46" cy="34" r="16" fill="#f8fafc" />
    <path d="M 22 75 Q 46 50 70 75 Z" fill="#cbd5e1" />
    <g transform="translate(115, 34)">
      <text x="0" y="0" class="article-title">Has the S&amp;P 500 Reached Peak</text>
      <text x="0" y="32" class="article-title">Optimism? Technical Signals Say Yes</text>
      <text x="0" y="72" class="author-meta">Pinchas Cohen <tspan fill="#64748b">•</tspan> 11 h ago  <tspan fill="#64748b">💬 12</tspan></text>
      <g transform="translate(0, 110)">
        <rect x="0" y="0" width="295" height="38" rx="19" fill="#141722" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <text x="16" y="25" class="ticker-symbol"><tspan fill="#94a3b8">S&amp;P 500</tspan> <tspan class="ticker-val-up">+0.82%</tspan> <tspan fill="#94a3b8">NASDAQ</tspan> <tspan class="ticker-val-up">+1.14%</tspan></text>
      </g>
    </g>
  </g>

  <line x1="42" y1="1025" x2="${width - 42}" y2="1025" stroke="rgba(255,255,255,0.07)" stroke-width="1" />

  <!-- Article 4: Gold Is Down $1,000 (Louis Navellier) -->
  <g transform="translate(42, 1055)">
    <circle cx="46" cy="46" r="46" fill="url(#avatarGrad4)" />
    <circle cx="46" cy="34" r="16" fill="#f8fafc" />
    <path d="M 22 75 Q 46 50 70 75 Z" fill="#cbd5e1" />
    <g transform="translate(115, 34)">
      <text x="0" y="0" class="article-title">Gold Is Down $1,000 Since January:</text>
      <text x="0" y="32" class="article-title">Is the Bull Market Officially Over?</text>
      <text x="0" y="72" class="author-meta">Louis Navellier <tspan fill="#64748b">•</tspan> 13 Jun  <tspan fill="#64748b">💬 8</tspan></text>
      <g transform="translate(0, 110)">
        <rect x="0" y="0" width="265" height="38" rx="19" fill="#141722" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <text x="16" y="25" class="ticker-symbol"><tspan fill="#94a3b8">FTSE 100</tspan> <tspan class="ticker-val-down">-0.12%</tspan> <tspan fill="#94a3b8">DAX</tspan> <tspan class="ticker-val-up">+0.35%</tspan></text>
      </g>
    </g>
  </g>

  <!-- Article 5: Gold Investors (Lance Roberts) -->
  <g transform="translate(42, 1295)">
    <circle cx="46" cy="46" r="46" fill="url(#avatarGrad5)" />
    <circle cx="46" cy="34" r="16" fill="#f8fafc" />
    <path d="M 22 75 Q 46 50 70 75 Z" fill="#cbd5e1" />
    <g transform="translate(115, 34)">
      <text x="0" y="0" class="article-title">Gold Investors Are Likely Confused</text>
      <text x="0" y="32" class="article-title">By the Recent Rate Stance</text>
      <text x="0" y="72" class="author-meta">Lance Roberts <tspan fill="#64748b">•</tspan> 11 h ago</text>
    </g>
  </g>

  <!-- Floating Frosted Glass Bottom Dock -->
  <g transform="translate(65, 1485)" filter="url(#shadow)">
    <rect width="650" height="96" rx="48" fill="url(#dockGrad)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
    
    <!-- Dock Item 1: Markets (Active highlighted) -->
    <g transform="translate(70, 24)">
      <path d="M 0 32 L 8 20 L 16 26 L 28 8 L 36 8 M 36 8 L 26 8 M 36 8 L 36 18" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <text x="18" y="52" class="dock-label-active">Markets</text>
    </g>

    <!-- Dock Item 2: News -->
    <g transform="translate(200, 24)">
      <rect x="0" y="8" width="34" height="26" rx="4" stroke="#94a3b8" stroke-width="2.5" fill="none" />
      <line x1="6" y1="16" x2="20" y2="16" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
      <line x1="6" y1="22" x2="28" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
      <line x1="6" y1="27" x2="24" y2="27" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
      <text x="17" y="52" class="dock-label">News</text>
    </g>

    <!-- Dock Item 3: Ideas -->
    <g transform="translate(330, 24)">
      <path d="M 18 6 C 9 6 6 13 6 18 C 6 22 10 25 12 28 L 24 28 C 26 25 30 22 30 18 C 30 13 27 6 18 6 Z" stroke="#94a3b8" stroke-width="2.5" fill="none" />
      <line x1="13" y1="32" x2="23" y2="32" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
      <text x="18" y="52" class="dock-label">Ideas</text>
    </g>

    <!-- Dock Item 4: Watchlist -->
    <g transform="translate(460, 24)">
      <path d="M 17 6 L 21 14 L 30 15 L 23 21 L 25 30 L 17 25 L 9 30 L 11 21 L 4 15 L 13 14 Z" stroke="#94a3b8" stroke-width="2.5" stroke-linejoin="round" fill="none" />
      <text x="17" y="52" class="dock-label">Watchlist</text>
    </g>

    <!-- Dock Item 5: More -->
    <g transform="translate(585, 24)">
      <line x1="2" y1="12" x2="28" y2="12" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
      <line x1="2" y1="20" x2="28" y2="20" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
      <line x1="2" y1="28" x2="28" y2="28" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
      <text x="15" y="52" class="dock-label">More</text>
    </g>
  </g>

  <!-- iOS Home Bar Indicator -->
  <rect x="${(width - 240) / 2}" y="${height - 24}" width="240" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
</svg>
`;

const targetPath = path.join(__dirname, '..', 'public', 'templates', 'stock-analysis.png');
sharp(Buffer.from(svg))
  .png({ quality: 100 })
  .toFile(targetPath)
  .then(() => console.log('Successfully regenerated stock-analysis.png at:', targetPath))
  .catch(console.error);
