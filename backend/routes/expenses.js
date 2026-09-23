import express from "express";
import Expense from "../models/Expense.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const { product } = req.query;
  const filter = product ? { product } : {};
  const expenses = await Expense.find(filter).populate("product", "name").sort("-date");
  res.json(expenses);
});

router.post("/", async (req, res) => {
  try {
    const product = await Product.findById(req.body.product);
    if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });
    const expense = await Expense.create({
      ...req.body,
      name: req.body.name?.trim() || product.name,
      createdBy: req.user._id,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Khong tim thay khoan chi" });

    expense.name = req.body.name?.trim() || expense.name;
    expense.type = req.body.type || expense.type;
    expense.amount = Number(req.body.amount ?? expense.amount);
    expense.note = req.body.note || "";
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ message: "Da xoa khoan chi" });
});

export default router;
