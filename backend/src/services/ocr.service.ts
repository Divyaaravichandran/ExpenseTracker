import Tesseract from "tesseract.js";
import fs from "fs/promises";
import { ImagePreprocessService } from "./imagePreprocess.service";

export class OcrService {
  static async extractText(imagePath: string): Promise<string> {
    let processedPath: string | null = null;
    const keepProcessedImage = process.env.OCR_KEEP_PROCESSED_IMAGE === "true";

    try {
      processedPath = await ImagePreprocessService.preprocessImage(imagePath);
      const result = await Tesseract.recognize(processedPath, "eng");

      return result.data.text
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n");
    } catch (error) {
      throw new Error(`OCR extraction failed: ${(error as Error).message}`);
    } finally {
      if (!keepProcessedImage && processedPath) {
        try {
          await fs.unlink(processedPath);
        } catch {
          // Ignore cleanup errors so OCR flow remains unaffected.
        }
      }
    }
  }
}
