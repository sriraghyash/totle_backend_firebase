import express from "express";
import { getTableNames } from "../utils/getTables.js"; // Import the function to fetch table names

const router = express.Router();

/**
 * ✅ Route: GET /api/db/tables
 * ✅ Description: Fetch all table names from the PostgreSQL database
 * ✅ Access: Admin only (You can add authentication middleware later)
 */
router.get("/tables", async (req, res) => {
  try {
    const tables = await getTableNames();
    res.status(200).json({ success: true, tables });
  } catch (error) {
    console.error("❌ Error fetching tables:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tables" });
  }
});

export default router;
