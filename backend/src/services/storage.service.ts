import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export const saveUploadedFile = async (file: Express.Multer.File): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const extension = MIME_EXTENSION_MAP[file.mimetype] || "bin";
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadsDir, filename);

  await fs.writeFile(absolutePath, file.buffer);

  return `/uploads/${filename}`;
};