import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export class ImagePreprocessService {
  static async preprocessImage(inputPath: string): Promise<string> {
    try {
      const uploadsDir = path.dirname(inputPath);
      const originalFilename = path.basename(inputPath);
      const outputPath = path.join(uploadsDir, `processed_${originalFilename}`);

      await fs.mkdir(uploadsDir, { recursive: true });

      await sharp(inputPath)
        .resize({ width: 1200 })
        .grayscale()
        .normalize()
        .modulate({ brightness: 1.05 })
        .linear(1.2, -10)
        .sharpen({ sigma: 0.8, m1: 1, m2: 2 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      throw new Error(`Failed to preprocess image: ${(error as Error).message}`);
    }
  }
}
