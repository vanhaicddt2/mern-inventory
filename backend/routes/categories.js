import express from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

const toSlug = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

router.get("/", async (req, res) => {
  const categories = await Category.find().sort("name");
  // dem so san pham trong tung danh muc
  const withCount = await Promise.all(
    categories.map(async (c) => ({
      ...c.toObject(),
      productCount: await Product.countDocuments({ category: c._id }),
    }))
  );
  res.json(withCount);
});

router.post("/", async (req, res) => {
  try {
    const { name, icon, color, description } = req.body;
    const category = await Category.create({ name, slug: toSlug(name), icon, color, description });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, icon, color, description } = req.body;
    const update = { icon, color, description };
    if (name) update.name = name, (update.slug = toSlug(name));
    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const count = await Product.countDocuments({ category: req.params.id });
  if (count > 0)
    return res.status(400).json({ message: "Khong the xoa danh muc con san pham ben trong" });
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Da xoa danh muc" });
});

export default router;
