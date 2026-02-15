import multer from "multer";
import { HttpError } from "../utils/HttpError";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
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