import mongoose, { Document, Schema } from "mongoose";

export interface IMark {
  criteria: string;
  awardedMarks: number;
  maxMarks: number;
}

export interface IEvaluationModel extends Document {
  studentId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  subject: string;
  marks: IMark[];
  totalMarks: number;
  grade: string;
  feedback?: string;
}

const EvaluationSchema = new Schema<IEvaluationModel>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    subject: { type: String, required: true },
    marks: [
      {
        criteria: { type: String, required: true },
        awardedMarks: { type: Number, required: true },
        maxMarks: { type: Number, required: true },
      },
    ],
    totalMarks: { type: Number, required: true },
    grade: { type: String, required: true },
    feedback: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IEvaluationModel>("Evaluation", EvaluationSchema);
