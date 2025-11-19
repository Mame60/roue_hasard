import { Router } from "express";
import {
  getLastDraw,
  listEntries,
  listAdmins,
  login,
} from "../controllers/publicController";

const router = Router();

router.get("/last-draw", getLastDraw);
router.get("/entries", listEntries);
router.get("/admins", listAdmins);
router.post("/login", login);

export default router;

