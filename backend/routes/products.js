import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Purchase from "../models/Purchase.js";
import Sale from "../models/Sale.js";
import Expense from "../models/Expense.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// GET /api/products?category=xxx&search=xxx
router.get("/", async (req, res) => {
  const { category, search } = req.query;
  const filter = { owner: req.user._id };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: "i" };
  const products = await Product.find(filter).populate("category", "name color icon").sort("-createdAt");
  res.json(products);
});

// GET /api/products/:id  -> chi tiet + lich su nhap/ban/chi phi
router.get("/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id }).populate("category", "name color icon");
  if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

  const [purchases, sales, expenses] = await Promise.all([
    Purchase.find({ product: product._id, owner: req.user._id }).populate("product", "name").sort("-date"),
    Sale.find({ product: product._id, owner: req.user._id }).sort("-date"),
    Expense.find({ product: product._id, owner: req.user._id }).sort("-date"),
  ]);

  const totalPurchaseCost = purchases.reduce((s, p) => s + p.totalCost, 0);
  const totalRevenue = sales.reduce((s, sVal) => s + sVal.totalRevenue, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalPurchaseCost - totalExpense;

  res.json({
    product,
    purchases,
    sales,
    expenses,
    summary: { totalPurchaseCost, totalRevenue, totalExpense, profit },
  });
});

router.post("/", async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.body.category, owner: req.user._id });
    if (!category) return res.status(404).json({ message: "Khong tim thay danh muc" });
    const data = { ...req.body, owner: req.user._id };
    if (typeof data.sku === "string") data.sku = data.sku.trim() || undefined;
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const update = { ...req.body, owner: req.user._id };
    if (typeof update.sku === "string") update.sku = update.sku.trim() || undefined;
    if (update.category && !(await Category.findOne({ _id: update.category, owner: req.user._id }))) {
      return res.status(404).json({ message: "Khong tim thay danh muc" });
    }
    delete update._id;
    const product = await Product.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, update, { new: true });
    if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });
  await Promise.all([
    Purchase.deleteMany({ product: req.params.id, owner: req.user._id }),
    Sale.deleteMany({ product: req.params.id, owner: req.user._id }),
    Expense.deleteMany({ product: req.params.id, owner: req.user._id }),
  ]);
  res.json({ message: "Da xoa san pham" });
});

export default router;
