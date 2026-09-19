import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    image: { type: String, default: "" },
    costPrice: { type: Number, default: 0 }, // gia nhap trung binh
    sellPrice: { type: Number, default: 0 }, // gia ban de xuat
    stockQty: { type: Number, default: 0 },
    minStock: { type: Number, default: 2 }, // canh bao het hang
    status: { type: String, enum: ["active", "discontinued"], default: "active" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
