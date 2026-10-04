import { Router } from "express";
import { createLead, getLeadList, masterData } from "../../controller/lead/lead.contoller";

const router = Router();

router.get("/master-data", masterData);
router.get("/", getLeadList);
router.get("/list", getLeadList);

router.post("/", createLead);

export default router;