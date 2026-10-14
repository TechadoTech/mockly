import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { imagekit } from "@/lib/imagekit";

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

    // 2. Parse file payload
    const body = await request.json();
    const { file, fileName } = body;

    if (!file || typeof file !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'file' parameter (expected base64 string or image URL)." },
        { status: 400 }
      );
    }

    // Limit base64 payload size to ~9MB binary (max 12MB base64 string) to prevent memory & storage exhaustion
    const MAX_BASE64_LENGTH = 12 * 1024 * 1024;
    if (file.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "Image file exceeds maximum allowed size (8MB)." },
        { status: 413 }
      );
    }

    // Ensure upload is a valid raster image format or secure web URL
    const isValidFormat = 
      file.startsWith("data:image/png;base64,") ||
      file.startsWith("data:image/jpeg;base64,") ||
      file.startsWith("data:image/jpg;base64,") ||
      file.startsWith("data:image/webp;base64,") ||
      file.startsWith("https://") ||
      file.startsWith("http://");

    if (!isValidFormat) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PNG, JPEG, or WEBP image." },
        { status: 400 }
      );
    }

    // Sanitize fileName to prevent path traversal
    const safeFileName = fileName && typeof fileName === "string"
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
      : `screenshot-${session.user.id}-${Date.now()}.png`;

    // 3. Upload file to ImageKit using secure server instance
    const uploadRes = await imagekit.upload({
      file: file, // Accept raw base64 string or URL
      fileName: safeFileName,
      folder: `/mockly/screenshots/${session.user.id}`,
    });

    // 4. Return secure public CDN url
    return NextResponse.json({
      url: uploadRes.url,
      fileId: uploadRes.fileId,
    });
  } catch (error: any) {
    console.error("Error in secure /api/upload route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
