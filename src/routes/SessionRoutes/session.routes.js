import { bookFreeSession } from "../../controllers/UserControllers/session.controllers.js";
import express from "express";
const router = express.Router();


router.post("/book", bookFreeSession);

export default router;