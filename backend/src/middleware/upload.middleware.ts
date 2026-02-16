import multer from "multer";
import fs from "fs";
import path from "path";
import { HttpError } from "../utils/HttpError";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
    cb(null, `${Date.now()}-${safeOriginalName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new HttpError(400, "Only image files are allowed"));
    }

    return cb(null, true);
  }
});

export const uploadSingleBill = upload.single("bill");