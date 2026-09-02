import sharp from "sharp";
import fs from "fs";

/**
 * Reduces the size of an image file to fit within MAX_WIDTH/MAX_HEIGHT 
 * and stay below MAX_FILE_SIZE (default 1MB).
 */
export async function sizeReducer(filePath: string): Promise<void> {
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 2000;
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

    let quality = 90;

    // Read original file into buffer first
    if (!fs.existsSync(filePath)) {
        console.warn(`sizeReducer: File not found at ${filePath}`);
        return;
    }

    const originalBuffer = fs.readFileSync(filePath);

    try {
        let buffer = await sharp(originalBuffer)
            .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside" })
            .jpeg({ quality })
            .toBuffer();

        while (buffer.length > MAX_FILE_SIZE && quality >= 50) {
            quality -= 10;
            buffer = await sharp(originalBuffer)
                .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside" })
                .jpeg({ quality })
                .toBuffer();
        }

        if (buffer.length > MAX_FILE_SIZE) {
            console.warn(`sizeReducer: Resized image still exceeds 1MB limit for ${filePath}`);
        }

        fs.writeFileSync(filePath, buffer);
    } catch (err) {
        console.error(`sizeReducer Error processing ${filePath}:`, err);
    }
}
