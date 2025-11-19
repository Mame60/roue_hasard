import { Router } from "express";
import {
  addNames,
  drawName,
  removeName,
  updateName,
  getUsers,
  updateEmail,
  updateUser,
} from "../controllers/adminController";

const router = Router();

router.post("/wheel", addNames);
router.post("/draw", drawName);
router.delete("/wheel/:id", removeName);
router.put("/wheel/:id", updateName);
router.get("/users", getUsers);
router.put("/users/:id/email", updateEmail);
router.put("/users/:id/name", updateUser);

export default router;

