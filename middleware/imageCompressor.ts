import sharp from "sharp";
import fs from "fs";
import path from "path";

export async function compressImage(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = filePath.replace(ext, `-compressed${ext}`);

  let sharpInstance = sharp(filePath);

  if (ext === ".jpg" || ext === ".jpeg") {
    sharpInstance = sharpInstance.jpeg({ quality: 40 });
  } else if (ext === ".png") {
    sharpInstance = sharpInstance.png({ compressionLevel: 8 });
  } else if (ext === ".webp") {
    sharpInstance = sharpInstance.webp({ quality: 40 });
  } else {
    return; 
  }

  await sharpInstance.toFile(tempPath);

  // replace original file
  fs.unlinkSync(filePath);
  fs.renameSync(tempPath, filePath);
}
