import { Router } from "express";
import {
  createProject,
} from "../../controller/project/project.controller";

const router = Router();

router.post("/create", createProject);

export default router;