import mongoose, { Document, Schema } from "mongoose";

export type TaxLimitType = "yearly";

export interface ITaxRule extends Document {
  financialYear: string;
  section: string;
  title: string;
  applicableCategories: string[];
  maxLimit: number;
  limitType: TaxLimitType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaxRuleSchema = new Schema<ITaxRule>(
  {
    financialYear: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    applicableCategories: [{ type: String, required: true, trim: true }],
    maxLimit: { type: Number, required: true, min: 0 },
    limitType: { type: String, required: true, enum: ["yearly"], default: "yearly" },
    isActive: { type: Boolean, required: true, default: true }
  },
  {
    timestamps: true,
    collection: "tax_rules"
  }
);

TaxRuleSchema.index({ financialYear: 1 });
TaxRuleSchema.index({ section: 1 });
TaxRuleSchema.index({ financialYear: 1, section: 1 }, { unique: true });

export const TaxRule = mongoose.model<ITaxRule>("TaxRule", TaxRuleSchema);
