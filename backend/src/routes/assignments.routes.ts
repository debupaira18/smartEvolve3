import { Router, Request, Response } from "express";
import Assignment from "../models/Assignment";
import { protect } from "../middleware/auth";

const router = Router();
router.use(protect);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch assignments.", error: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.create(req.body);
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error("Assignment create error:", error);
    res.status(400).json({ message: "Invalid assignment data.", error: error.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Assignment not found." });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: "Update failed.", error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found." });
    res.json({ message: "Assignment deleted." });
  } catch (error: any) {
    res.status(400).json({ message: "Delete failed.", error: error.message });
  }
});

export default router;
