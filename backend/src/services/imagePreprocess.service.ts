import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export class ImagePreprocessService {
  static async preprocessImage(inputPath: string): Promise<string> {
    try {
      const uploadsDir = path.dirname(inputPath);
      const originalFilename = path.basename(inputPath);
      const outputPath = path.join(uploadsDir, `processed_${originalFilename}`);
      const fastMode = process.env.OCR_FAST_MODE !== "false";

      await fs.mkdir(uploadsDir, { recursive: true });

      const pipeline = sharp(inputPath)
        .resize({ width: fastMode ? 900 : 1000, withoutEnlargement: true })
        .grayscale()
        .normalize();

      if (fastMode) {
        await pipeline.sharpen().toFile(outputPath);
      } else {
        await pipeline
          .modulate({ brightness: 1.05 })
          .linear(1.2, -10)
          .sharpen({ sigma: 0.8, m1: 1, m2: 2 })
          .toFile(outputPath);
      }

      return outputPath;
    } catch (error) {
      throw new Error(`Failed to preprocess image: ${(error as Error).message}`);
    }
  }
}
