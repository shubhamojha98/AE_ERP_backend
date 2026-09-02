
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { Request } from "express";

/* ---------------- FILE FILTER ---------------- */
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const { docType } = req.body;

  if (docType && docType.toLowerCase() === "owner image") {
    const allowed = ["image/jpeg", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG/JPEG allowed for Owner Image") as any,
        false
      );
    }
  }
  cb(null, true);
};

/* ---------------- FILE COUNTER ---------------- */
const filesReceivedCount = { value: 0 };

/* =====================================================
   ✅ CUSTOM STORAGE WITH SHARP (CORRECT WAY)
   ===================================================== */
function sharpDiskStorage(moduleName?: string): multer.StorageEngine {
  return {
    async _handleFile(req, file, cb) {
      try {
        const docTypes = (req.body as any).docType;
        let docTypeForThisFile: string | undefined;

        if (Array.isArray(docTypes)) {
          docTypeForThisFile = docTypes[filesReceivedCount.value];
          filesReceivedCount.value++;
        }

        const subFolder = docTypeForThisFile
          ? docTypeForThisFile.toLowerCase().replace(/\s+/g, "_")
          : file.fieldname.toLowerCase().replace(/\s+/g, "_");

        const baseDir = moduleName
          ? `uploads/${moduleName}/${subFolder}`
          : `uploads/${subFolder}`;

        fs.mkdirSync(baseDir, { recursive: true });

        const filename =
          Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";

        // const finalPath = path.join(baseDir, filename);
        const finalPath = path.join(baseDir, filename).replace(/\\/g, "/");


        // ✅ convert stream → buffer
        const buffer = await streamToBuffer(file.stream);

        if (file.mimetype.startsWith("image/")) {
          await sharp(buffer)
            .jpeg({ quality: 70, mozjpeg: true })
            .toFile(finalPath);
        } else {
          fs.writeFileSync(finalPath, buffer);
        }

        cb(null, {
          destination: baseDir,
          filename,
          path: finalPath,
          size: buffer.length,
        });
      } catch (err) {
        cb(err as any);
      }
    },

    _removeFile(_req, file, cb) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      cb(null);
    },
  };
}
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}


/* =====================================================
   ✅ OLD API — upload (MUST BE MULTER INSTANCE)
   ===================================================== */
export const upload = multer({
  storage: sharpDiskStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/* =====================================================
   ✅ OLD API — createModuleWiseUpload
   ===================================================== */
export function createModuleWiseUpload(moduleName: string, maxMb: number = 5) {
  return multer({
    storage: sharpDiskStorage(moduleName),
    fileFilter,
    limits: { fileSize: maxMb * 1024 * 1024 }, // Admin/System default 5MB limit
  });
}
