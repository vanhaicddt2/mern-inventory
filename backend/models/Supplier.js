import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true, index: true },
    email: { type: String, default: "", trim: true, lowercase: true, index: true },
    address: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

supplierSchema.index({ owner: 1, phone: 1 }, { unique: true, partialFilterExpression: { phone: { $gt: "" } } });
supplierSchema.index({ owner: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $gt: "" } } });

export default mongoose.model("Supplier", supplierSchema);
