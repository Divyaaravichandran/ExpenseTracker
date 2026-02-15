import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  keywords: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    keywords: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);