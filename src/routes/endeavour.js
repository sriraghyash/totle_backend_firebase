import express from "express";
import Endeavour from "../Models/Endeavour.js";


const router = express.Router();

// ➕ Create Endeavour
// ➕ Create Endeavour
router.post("/", async (req, res) => {
  try {
    console.log("📥 Incoming data:", req.body); // Debugging

    const endeavour = await Endeavour.create(req.body);

    res.status(201).json({
      success: true,
      message: "Endeavour created successfully",
      data: endeavour,
    });
  } catch (err) {
    console.error("❌ Error creating endeavour:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ✏️ Update Endeavour
router.put("/:id", async (req, res) => {
  try {
    const updated = await Endeavour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete Endeavour
router.delete("/:id", async (req, res) => {
  try {
    await Endeavour.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
