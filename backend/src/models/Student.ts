import mongoose, { Document, Schema } from "mongoose";

export interface IStudentModel extends Document {
  name: string;
  rollNo: string;
  email: string;
  subject: string;
  section: string;
  semester: number;
}

const StudentSchema = new Schema<IStudentModel>(
  {
    name:     { type: String, required: true, trim: true },
    rollNo:   { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
    subject:  { type: String, required: true, trim: true },
    section:  { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 }
  },
  { timestamps: true }
);

export default mongoose.model<IStudentModel>("Student", StudentSchema);
