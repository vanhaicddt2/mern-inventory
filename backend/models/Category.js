import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // Phone / Man hinh / Other
    slug: { type: String, required: true, unique: true, lowercase: true },
    icon: { type: String, default: "package" },
    color: { type: String, default: "#6366f1" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
