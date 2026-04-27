import mongoose, { Document, Schema } from "mongoose";

export interface IRubricItem {
  criteria: string;
  maxMarks: number;
}

export interface IAssignmentModel extends Document {
  title: string;
  subject: string;
  dueDate?: Date;
  templateName?: string;
  rubric: IRubricItem[];
}

const AssignmentSchema = new Schema<IAssignmentModel>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    dueDate: { type: Date },
    templateName: { type: String },
    rubric: [
      {
        criteria: { type: String, required: true },
        maxMarks: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IAssignmentModel>("Assignment", AssignmentSchema);
