import { Router, Request, Response } from "express";
import Evaluation from "../models/Evaluation";
import { protect } from "../middleware/auth";
import { gradeFromPercentage } from "../utils/grading";

const router = Router();
router.use(protect);

// ── IMPORTANT: /analytics/summary MUST come before /:id ──────────────────
// If /:id is first, Express treats "analytics" as an ID and throws CastError
router.get("/analytics/summary", async (_req: Request, res: Response) => {
  try {
    const evaluations = await Evaluation.find().populate("studentId", "name");
    if (!evaluations.length)
      return res.json({ average: 0, distribution: {}, topPerformers: [], weakStudents: [], atRiskCount: 0 });

    const average = evaluations.reduce((s, ev) => s + ev.totalMarks, 0) / evaluations.length;

    const distribution = evaluations.reduce<Record<string, number>>((acc, ev) => {
      acc[ev.grade] = (acc[ev.grade] || 0) + 1;
      return acc;
    }, {});

    const sorted = [...evaluations].sort((a, b) => b.totalMarks - a.totalMarks);
    const topPerformers = sorted.slice(0, 5);
    const weakStudents = sorted.filter((e) => e.grade === "F" || e.grade === "D");

    res.json({ average, distribution, topPerformers, weakStudents, atRiskCount: weakStudents.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics.", error });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const evaluations = await Evaluation.find()
      .populate("studentId", "name rollNo subject")
      .populate("assignmentId", "title subject");
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch evaluations.", error });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { marks } = req.body;
    if (!marks || !Array.isArray(marks) || marks.length === 0)
      return res.status(400).json({ message: "marks array is required." });

    const totalMarks = marks.reduce((sum: number, m: { awardedMarks: number }) => sum + Number(m.awardedMarks), 0);
    const max = marks.reduce((sum: number, m: { maxMarks: number }) => sum + Number(m.maxMarks), 0);
    const grade = gradeFromPercentage((totalMarks / Math.max(max, 1)) * 100);

    const created = await Evaluation.create({ ...req.body, totalMarks, grade });
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Evaluation create error:", error);
    res.status(400).json({ message: "Invalid evaluation data.", error: error.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { marks } = req.body;
    const totalMarks = marks.reduce((sum: number, m: { awardedMarks: number }) => sum + Number(m.awardedMarks), 0);
    const max = marks.reduce((sum: number, m: { maxMarks: number }) => sum + Number(m.maxMarks), 0);
    const grade = gradeFromPercentage((totalMarks / Math.max(max, 1)) * 100);

    const updated = await Evaluation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, totalMarks, grade },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Evaluation not found." });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: "Update failed.", error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Evaluation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Evaluation not found." });
    res.json({ message: "Evaluation deleted." });
  } catch (error: any) {
    res.status(400).json({ message: "Delete failed.", error: error.message });
  }
});

export default router;
