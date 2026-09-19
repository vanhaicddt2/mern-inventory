import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true, index: true },
    email: { type: String, default: "", trim: true, lowercase: true, index: true },
    address: { type: String, default: "" },
    note: { type: String, default: "" },
    isRetailGuest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model("Customer", customerSchema);
