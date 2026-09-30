import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    icon: { type: String, default: "package" },
    color: { type: String, default: "#6366f1" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

categorySchema.index({ owner: 1, name: 1 }, { unique: true });
categorySchema.index({ owner: 1, slug: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
