import { Router, Request, Response } from "express";
import Evaluation from "../models/Evaluation";
import { protect } from "../middleware/auth";

const router = Router();
router.use(protect);

router.get("/student/:studentId", async (req: Request, res: Response) => {
  try {
    const reports = await Evaluation.find({ studentId: req.params.studentId })
      .populate("studentId", "name rollNo subject semester")
      .populate("assignmentId", "title");
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch student report.", error: error.message });
  }
});

router.get("/all", async (_req: Request, res: Response) => {
  try {
    const reports = await Evaluation.find()
      .populate("studentId", "name rollNo subject semester")
      .populate("assignmentId", "title");
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch reports.", error: error.message });
  }
});

export default router;
