import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export async function uploadImageToBlob(
  file: File,
  folder: string = "products"
): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `${folder}/${nanoid()}.${extension}`;

  const blob = await put(filename, file, {
    access: "public",
  });

  return blob.url;
}

export function isValidImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    mimeType
  );
}

export function isValidImageSize(bytes: number, maxMB: number = 5): boolean {
  return bytes <= maxMB * 1024 * 1024;
}
