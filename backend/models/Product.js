import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
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

productSchema.index(
  { owner: 1, sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $type: "string", $gt: "" } } }
);

export default mongoose.model("Product", productSchema);
