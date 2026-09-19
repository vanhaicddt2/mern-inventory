import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true, index: true },
    email: { type: String, default: "", trim: true, lowercase: true, index: true },
    address: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

supplierSchema.index({ phone: 1 }, { unique: true, sparse: true });
supplierSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model("Supplier", supplierSchema);
