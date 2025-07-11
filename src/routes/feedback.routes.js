import express, { Router } from "express";
import { getAllFeedback , postFeedBack } from "../controllers/feedback.controller.js";

const router = express.Router();

router.post("/send",postFeedBack);
router.get("/get",getAllFeedback);

export default router;