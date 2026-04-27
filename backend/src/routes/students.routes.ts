import { Router, Request, Response } from "express";
import Student from "../models/Student";
import Evaluation from "../models/Evaluation";
import { protect } from "../middleware/auth";

const router = Router();
router.use(protect);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch students.", error: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const created = await Student.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `A student with this ${field} already exists.` });
    }
    res.status(400).json({ message: "Invalid student data.", error: error.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Student not found." });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `A student with this ${field} already exists.` });
    }
    res.status(400).json({ message: "Update failed.", error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Student not found." });
    // Cascade: delete all evaluations/reports belonging to this student
    await Evaluation.deleteMany({ studentId: req.params.id });
    res.json({ message: "Student deleted." });
  } catch (error: any) {
    res.status(400).json({ message: "Delete failed.", error: error.message });
  }
});

export default router;
