import { Request, Response, NextFunction } from "express";
import { compressImage } from "./imageCompressor";

export async function compressUploadedImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.files) return next();

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    //  for (const file of files as Express.Multer.File[]) {
    // if (file.mimetype.startsWith("image/")) {
    //   await compressImage(file.path);
    // }

    const imageFiles = (files as Express.Multer.File[]).filter(file => file.mimetype.startsWith("image/"));

    if (imageFiles.length > 0) {
      // Parallelize compression for speed
      await Promise.all(imageFiles.map(file => compressImage(file.path)));
    }


    next();
  } catch (err) {
    next(err);
  }
}
