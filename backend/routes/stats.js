import express from "express";
import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// GET /api/stats/overview -> tong quan nhanh cho dashboard
router.get("/overview", async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [sales, purchases, expenses, productCount, categoryCount, lowStock] = await Promise.all([
    Sale.find({ date: { $gte: start, $lt: end } }),
    Purchase.find({ date: { $gte: start, $lt: end } }),
    Expense.find({ date: { $gte: start, $lt: end } }),
    Product.countDocuments(),
    Category.countDocuments(),
    Product.find({ $expr: { $lte: ["$stockQty", "$minStock"] } }).select("name stockQty minStock"),
  ]);

  const totalRevenue = sales.reduce((s, x) => s + x.totalRevenue, 0);
  const totalPurchaseCost = purchases.reduce((s, x) => s + x.totalCost, 0);
  const totalExpense = expenses.reduce((s, x) => s + x.amount, 0);

  res.json({
    year,
    totalRevenue,
    totalPurchaseCost,
    totalExpense,
    profit: totalRevenue - totalPurchaseCost - totalExpense,
    productCount,
    categoryCount,
    orderCount: sales.length,
    lowStock,
  });
});

// GET /api/stats/monthly?year=2026 -> doanh thu/loi nhuan tung thang trong nam
router.get("/monthly", async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [sales, purchases, expenses] = await Promise.all([
    Sale.find({ date: { $gte: start, $lt: end } }),
    Purchase.find({ date: { $gte: start, $lt: end } }),
    Expense.find({ date: { $gte: start, $lt: end } }),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 0,
    purchaseCost: 0,
    expense: 0,
    profit: 0,
  }));

  sales.forEach((s) => (months[new Date(s.date).getMonth()].revenue += s.totalRevenue));
  purchases.forEach((p) => (months[new Date(p.date).getMonth()].purchaseCost += p.totalCost));
  expenses.forEach((e) => (months[new Date(e.date).getMonth()].expense += e.amount));
  months.forEach((m) => (m.profit = m.revenue - m.purchaseCost - m.expense));

  res.json(months);
});

// GET /api/stats/yearly -> doanh thu tung nam (5 nam gan nhat)
router.get("/yearly", async (req, res) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

  const results = await Promise.all(
    years.map(async (year) => {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      const [sales, purchases, expenses] = await Promise.all([
        Sale.find({ date: { $gte: start, $lt: end } }),
        Purchase.find({ date: { $gte: start, $lt: end } }),
        Expense.find({ date: { $gte: start, $lt: end } }),
      ]);
      const revenue = sales.reduce((s, x) => s + x.totalRevenue, 0);
      const purchaseCost = purchases.reduce((s, x) => s + x.totalCost, 0);
      const expense = expenses.reduce((s, x) => s + x.amount, 0);
      return { year, revenue, purchaseCost, expense, profit: revenue - purchaseCost - expense };
    })
  );

  res.json(results);
});

// GET /api/stats/by-category?year=2026 -> doanh thu theo tung danh muc lon (Phone/Man/Other)
router.get("/by-category", async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const categories = await Category.find();
  const results = await Promise.all(
    categories.map(async (cat) => {
      const products = await Product.find({ category: cat._id }).select("_id");
      const productIds = products.map((p) => p._id);
      const sales = await Sale.find({ product: { $in: productIds }, date: { $gte: start, $lt: end } });
      const revenue = sales.reduce((s, x) => s + x.totalRevenue, 0);
      return { category: cat.name, color: cat.color, revenue, productCount: products.length };
    })
  );

  res.json(results);
});

export default router;
