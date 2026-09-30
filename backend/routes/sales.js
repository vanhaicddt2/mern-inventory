import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const { product } = req.query;
  const filter = { owner: req.user._id, ...(product ? { product } : {}) };
  const sales = await Sale.find(filter).populate("product", "name").populate("customerId", "name phone email").sort("-date");
  res.json(sales);
});

router.post("/", async (req, res) => {
  try {
    const { product, name, quantity, unitPrice, profit, customer, customerId, date, note } = req.body;
    const p = await Product.findOne({ _id: product, owner: req.user._id });
    if (!p) return res.status(404).json({ message: "Khong tim thay san pham" });
    if (p.stockQty <= 0)
      return res.status(400).json({ message: "San pham da het ton kho, khong the tao don ban moi" });
    if (p.stockQty < quantity)
      return res.status(400).json({ message: `Khong du hang ton kho (con ${p.stockQty})` });

    let resolvedCustomerId = null;
    let resolvedCustomerName = "Khách lẻ";

    if (customerId) {
      const foundCustomer = await Customer.findOne({ _id: customerId, owner: req.user._id });
      if (!foundCustomer) return res.status(404).json({ message: "Khong tim thay khach hang" });
      resolvedCustomerId = foundCustomer._id;
      resolvedCustomerName = foundCustomer.name;
    } else if (customer?.trim()) {
      resolvedCustomerName = customer.trim();
    }

    const totalRevenue = quantity * unitPrice;
    const sale = await Sale.create({
      owner: req.user._id,
      product,
      name: name?.trim() || p.name,
      customerId: resolvedCustomerId,
      quantity,
      unitPrice,
      totalRevenue,
      profit: Math.max(0, Number(profit) || 0),
      customer: resolvedCustomerName,
      date,
      note,
      createdBy: req.user._id,
    });

    p.stockQty -= Number(quantity);
    await p.save();

    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id });
    if (!sale) return res.status(404).json({ message: "Khong tim thay don ban" });

    sale.name = req.body.name?.trim() || sale.name;
    if (req.body.profit !== undefined) sale.profit = Math.max(0, Number(req.body.profit) || 0);
    sale.note = req.body.note || "";
    if (req.body.customerId !== undefined) {
      sale.customerId = req.body.customerId || null;
      if (req.body.customerId) {
        const customer = await Customer.findOne({ _id: req.body.customerId, owner: req.user._id });
        if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });
        sale.customer = customer.name;
      } else {
        sale.customer = "Khách lẻ";
      }
    }

    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id });
  if (!sale) return res.status(404).json({ message: "Khong tim thay" });
  const p = await Product.findOne({ _id: sale.product, owner: req.user._id });
  if (p) {
    p.stockQty += sale.quantity;
    await p.save();
  }
  await sale.deleteOne();
  res.json({ message: "Da xoa don ban" });
});

export default router;
