import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { imagekit } from "@/lib/imagekit";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import os from "os";

const CACHE_FILE = path.join(os.tmpdir(), "mockly-figma-cache.json");

interface CacheEntry {
  url: string;
  fileId: string;
  lastModified: string;
}

function readCache(): Record<string, CacheEntry> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("[Figma Sync Cache] Failed to read cache file:", e);
  }
  return {};
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[Figma Sync Cache] Failed to write cache file:", e);
  }
}

// Parser to fetch fileKey and node-ids (can support multiple frames selected at once)
function parseFigmaUrl(url: string) {
  try {
    const urlObj = new URL(url);
    
    // Figma paths: /design/:key/:title or /file/:key/:title
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2 || (pathParts[0] !== "design" && pathParts[0] !== "file")) {
      return null;
    }
    
    const fileKey = pathParts[1];
    
    // Node IDs are usually in multiple query parameters (or comma-separated inside one parameter)
    const rawNodeIds = urlObj.searchParams.getAll("node-id");
    if (!rawNodeIds || rawNodeIds.length === 0) {
      return null;
    }
    
    // Split by commas and trim to support format: ?node-id=10-24,10-25
    const nodeIds = rawNodeIds.flatMap((id) => id.split(",").map((x) => x.trim())).filter(Boolean);
    
    // Figma API expects ":" instead of "-" for node ids (replace all dashes globally)
    const resolvedNodeIds = nodeIds.map((id) => id.replace(/-/g, ":"));
    
    return { fileKey, nodeIds: resolvedNodeIds };
  } catch (e) {
    return null;
  }
}

class RateLimitError extends Error {
  waitTimeMs: number;
  constructor(message: string, waitTimeMs: number) {
    super(message);
    this.name = "RateLimitError";
    this.waitTimeMs = waitTimeMs;
  }
}

// Parses the Retry-After header safely handling seconds, milliseconds, HTTP-dates, and Unix timestamps.
// Uses the server's response date as a baseline to prevent local system clock drift from distorting the delay.
function parseRetryAfter(headerValue: string | null, serverDateHeader: string | null): number | null {
  if (!headerValue) return null;
  
  const nowBaseline = serverDateHeader ? (Date.parse(serverDateHeader) || Date.now()) : Date.now();
  
  // 1. Try parsing as a standard HTTP-date string (e.g. "Thu, 16 Jul 2026 12:49:49 GMT")
  const parsedDate = Date.parse(headerValue);
  if (!isNaN(parsedDate)) {
    const diff = parsedDate - nowBaseline;
    return diff > 0 ? diff : 0;
  }

  // 2. Parse as a numeric string
  const parsedNum = parseFloat(headerValue);
  if (isNaN(parsedNum)) return null;

  // If it's a Unix epoch timestamp in seconds (e.g. 1784208588)
  if (parsedNum > 1000000000) {
    const diffMs = (parsedNum * 1000) - nowBaseline;
    return diffMs > 0 ? diffMs : 0;
  }

  // If the number is large (e.g., > 3600), it's highly likely it is already in milliseconds
  // (Figma rate limits rarely keep you blocked for more than 1 hour).
  if (parsedNum > 3600) {
    return parsedNum;
  }

  // Otherwise, treat as seconds and convert to milliseconds
  return parsedNum * 1000;
}

interface CustomRequestInit extends RequestInit {
  isSharedToken?: boolean;
}

// Helper function to handle rate-limiting (429) and network/server flakiness (5xx) with retries
async function fetchWithRetry(url: string, options: CustomRequestInit, retries = 4, delay = 1000): Promise<Response> {
  const { isSharedToken, ...fetchOptions } = options;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, fetchOptions);
    
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get("retry-after");
      const serverDateHeader = res.headers.get("date");
      const waitTime = parseRetryAfter(retryAfterHeader, serverDateHeader) || (delay * Math.pow(2, i));

      // If we need to wait more than 10 seconds, abort retry to avoid serverless function timeouts
      if (waitTime > 10000) {
        const secondsToWait = Math.ceil(waitTime / 1000);
        const minutesToWait = (secondsToWait / 60).toFixed(1);
        
        let msg = `Figma API rate limit exceeded. Please wait ${secondsToWait} seconds (${minutesToWait} minutes) before syncing again.`;
        if (isSharedToken) {
          msg = `Shared Figma API rate limit exceeded. To bypass this, please add your own Figma Personal Access Token (PAT) in Settings > Account. Otherwise, you must wait ${secondsToWait} seconds (${minutesToWait} minutes).`;
        }
        
        throw new RateLimitError(msg, waitTime);
      }

      console.warn(`[Figma Sync] Rate limited (429). Retrying attempt ${i + 1}/${retries} after ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }
    
    if (res.status >= 500 && res.status < 600) {
      const waitTime = delay * Math.pow(2, i);
      console.warn(`[Figma Sync] Server error (${res.status}). Retrying attempt ${i + 1}/${retries} after ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }
    
    return res;
  }
  return fetch(url, fetchOptions); // Final fallback attempt
}

// Recursive helper to find a node by ID in the document tree
function findNodeInTree(node: any, targetId: string): any {
  if (!node) return null;
  if (node.id === targetId) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeInTree(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

// Helper to inspect node structure and unpack children of sections, groups, and large layout canvases.
// ANY node that contains 2+ child FRAME/COMPONENT/INSTANCE nodes is treated as a container and unpacked.
async function resolveNodeIds(
  fileKey: string, 
  nodeIds: string[], 
  token: string, 
  isSharedToken: boolean
): Promise<{ resolvedIds: string[]; lastModified?: string }> {
  try {
    // Fetch structure for only selected nodes up to depth=2 (shallow & fast, avoids heavy nested vector/text downloads)
    const figmaFileUrl = `https://api.figma.com/v1/files/${fileKey}?ids=${nodeIds.join(",")}&depth=2`;
    console.log("[Figma Sync] Fetching file structure (shallow):", figmaFileUrl);
    const res = await fetchWithRetry(figmaFileUrl, {
      headers: { "X-Figma-Token": token },
      isSharedToken,
    });
    if (!res.ok) {
      console.warn("[Figma Sync] File structure fetch failed, using original node IDs");
      return { resolvedIds: nodeIds };
    }

    const data = await res.json();
    const resolvedIds: string[] = [];

    for (const nodeId of nodeIds) {
      // Find the requested node document inside the returned document tree
      const nodeData = findNodeInTree(data.document, nodeId);
      if (!nodeData) {
        console.log(`[Figma Sync] Node ${nodeId}: not found in response document tree, keeping as-is`);
        resolvedIds.push(nodeId);
        continue;
      }

      const { type, children } = nodeData;
      console.log(`[Figma Sync] Node ${nodeId}: type=${type}, name="${nodeData.name}", children=${children?.length ?? 0}`);

      // Types that are always containers
      const isContainer = type === "SECTION" || type === "GROUP" || type === "CANVAS" || type === "PAGE";

      // For FRAME type: unpack if it has 2+ renderable child frames
      // (a single-screen frame with decorative child layers should NOT be unpacked)
      const renderableChildren = (children || []).filter(
        (child: any) => child.type === "FRAME" || child.type === "COMPONENT" || child.type === "INSTANCE"
      );

      const shouldUnpack = (isContainer && renderableChildren.length > 0) ||
                           (type === "FRAME" && renderableChildren.length >= 2);

      if (shouldUnpack) {
        console.log(`[Figma Sync] Unpacking container "${nodeData.name}" → ${renderableChildren.length} child screens`);
        renderableChildren.forEach((child: any) => resolvedIds.push(child.id));
      } else {
        resolvedIds.push(nodeId);
      }
    }

    console.log(`[Figma Sync] Resolved ${nodeIds.length} input node(s) → ${resolvedIds.length} screen node(s):`, resolvedIds);
    return { resolvedIds, lastModified: data.lastModified };
  } catch (e) {
    console.error("[Figma Sync] Error resolving node IDs:", e);
    return { resolvedIds: nodeIds };
  }
}

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

    // 2. Parse payload
    const body = await request.json();
    const { figmaUrl } = body;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: "Figma URL is required." },
        { status: 400 }
      );
    }

    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      return NextResponse.json(
        { 
          error: "Invalid Figma URL format. Please select your frame(s) in Figma, right-click, select 'Copy link to selection', and paste it here." 
        },
        { status: 400 }
      );
    }

    const { fileKey, nodeIds } = parsed;

    // 3. Resolve Figma Token (User PAT or global fallback)
    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const hasUserToken = !!dbUser?.figmaToken;
    const token = dbUser?.figmaToken || process.env.FIGMA_PAT;
    const isSharedToken = !hasUserToken;

    if (!token) {
      return NextResponse.json(
        { error: "Figma integration is not configured. Please add your Figma Personal Access Token in your Account settings." },
        { status: 400 }
      );
    }

    // 3.5 Resolve container nodes (sections, groups, canvas frames) to child screen nodes
    const { resolvedIds: rawResolvedIds, lastModified } = await resolveNodeIds(fileKey, nodeIds, token, isSharedToken);
    // Cap to maximum 7 screens per sync to prevent resource exhaustion and serverless timeouts
    const resolvedIds = rawResolvedIds.slice(0, 7);

    const screenshots: Array<{ nodeId: string; url: string; fileId: string }> = [];
    const nodesToRender: string[] = [];

    // Load persistent cache
    const cache = readCache();
    const activeLastModified = lastModified || "unknown";

    console.log(`[Figma Sync Cache] Checking cache for ${resolvedIds.length} resolved node(s)...`);
    for (const nodeId of resolvedIds) {
      const cacheKey = `${fileKey}_${nodeId}`;
      const cached = cache[cacheKey];

      if (cached && cached.lastModified === activeLastModified && cached.url) {
        console.log(`[Figma Sync Cache] Cache HIT for node ${nodeId} (${cached.url})`);
        screenshots.push({
          nodeId,
          url: cached.url,
          fileId: cached.fileId,
        });
      } else {
        console.log(`[Figma Sync Cache] Cache MISS for node ${nodeId} (reason: ${cached ? "outdated" : "not in cache"})`);
        nodesToRender.push(nodeId);
      }
    }

    if (nodesToRender.length > 0) {
      console.log(`[Figma Sync] Cache misses found. Requesting renders sequentially for ${nodesToRender.length} node(s)...`);
      let cacheUpdated = false;

      for (let idx = 0; idx < nodesToRender.length; idx++) {
        const nodeId = nodesToRender[idx];
        console.log(`[Figma Sync] Rendering node ${idx + 1}/${nodesToRender.length}: ${nodeId}`);
        
        try {
          const figmaApiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=1`;
          const figmaRes = await fetchWithRetry(figmaApiUrl, {
            headers: {
              "X-Figma-Token": token,
            },
            isSharedToken,
          });

          if (!figmaRes.ok) {
            const errData = await figmaRes.json();
            console.error(`[Figma Sync] Failed to render node ${nodeId}:`, errData);
            continue;
          }

          const figmaData = await figmaRes.json();
          const imageUrl = figmaData.images?.[nodeId];
          if (!imageUrl) {
            console.warn(`[Figma Sync] No image URL returned for node ${nodeId}`);
            continue;
          }

          // Download image binary
          const imgResponse = await fetchWithRetry(imageUrl, {});
          if (!imgResponse.ok) continue;

          const arrayBuffer = await imgResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64File = buffer.toString("base64");

          // Upload to ImageKit
          const uploadRes = await imagekit.upload({
            file: base64File,
            fileName: `figma-${fileKey}-${nodeId.replace(/:/g, "-")}-${Date.now()}.png`,
            folder: `/mockly/screenshots/${session.user.id}`,
          });

          // Add to response screenshots
          screenshots.push({
            nodeId,
            url: uploadRes.url,
            fileId: uploadRes.fileId,
          });

          // Save to cache
          const cacheKey = `${fileKey}_${nodeId}`;
          cache[cacheKey] = {
            url: uploadRes.url,
            fileId: uploadRes.fileId,
            lastModified: activeLastModified,
          };
          cacheUpdated = true;

          // Sleep for 500ms between sequential requests to prevent triggering burst rate limits
          if (idx < nodesToRender.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          console.error(`[Figma Sync] Error processing node ${nodeId}:`, error);
          if (cacheUpdated) {
            writeCache(cache);
          }
          
          if (error.name === "RateLimitError") {
            // If we have at least one successfully resolved screenshot, return them instead of crashing
            if (screenshots.length > 0) {
              console.warn("[Figma Sync] Hit rate limit, but returning successfully fetched screenshots.");
              return NextResponse.json({ screenshots });
            }
            throw error; // Let the outer catch block handle it
          }
        }
      }

      // Persist updated cache
      if (cacheUpdated) {
        writeCache(cache);
      }
    } else {
      console.log("[Figma Sync Cache] All nodes resolved from cache! No Figma Image API calls needed.");
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: "Failed to download and process any selected frames from Figma." },
        { status: 502 }
      );
    }

    // Return the array of successfully synced screenshot items
    return NextResponse.json({
      screenshots,
    });

  } catch (error: any) {
    console.error("Error in figma sync route:", error);
    if (error.name === "RateLimitError") {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
