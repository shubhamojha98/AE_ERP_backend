import { Router } from "express";
import {
  createCustomer,
  createProject,
} from "../../controller/project/project.controller";

const router = Router();

router.post("/create-customer",createCustomer)

router.post("/create-project", createProject);

export default router;