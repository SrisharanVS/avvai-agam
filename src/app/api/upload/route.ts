import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum 5MB." },
        { status: 400 }
      );
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // Fallback: return a placeholder URL for local dev
      const placeholderUrl = `https://placehold.co/800x800/2D5016/F5F0E8?text=${encodeURIComponent(file.name.split(".")[0])}`;
      return NextResponse.json({
        success: true,
        url: placeholderUrl,
        message: "Using placeholder (configure BLOB_READ_WRITE_TOKEN for real uploads)",
      });
    }

    const { put } = await import("@vercel/blob");
    const { nanoid } = await import("nanoid");
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `products/${nanoid()}.${extension}`;

    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
