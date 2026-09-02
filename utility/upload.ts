import multer from "multer";
import path from "path";

export const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith(".xlsx")) cb(null, true);
    else cb(new Error("Only xlsx files allowed"));
  },
});
