// routes/admin.routes.js
import express from "express";
import { getAllUserDetails} from "../controllers/nucleus.controller.js";

const router = express.Router();

// Admin route to get personal info of a user
router.get("/user/info", getAllUserDetails);

export default router;
