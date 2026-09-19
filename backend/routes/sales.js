import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const { product } = req.query;
  const filter = product ? { product } : {};
  const sales = await Sale.find(filter).populate("product", "name").populate("customerId", "name phone email").sort("-date");
  res.json(sales);
});

router.post("/", async (req, res) => {
  try {
    const { product, quantity, unitPrice, customer, customerId, date, note } = req.body;
    const p = await Product.findById(product);
    if (!p) return res.status(404).json({ message: "Khong tim thay san pham" });
    if (p.stockQty < quantity)
      return res.status(400).json({ message: `Khong du hang ton kho (con ${p.stockQty})` });

    let resolvedCustomerId = null;
    let resolvedCustomerName = "Khách lẻ";

    if (customerId) {
      const foundCustomer = await Customer.findById(customerId);
      if (!foundCustomer) return res.status(404).json({ message: "Khong tim thay khach hang" });
      resolvedCustomerId = foundCustomer._id;
      resolvedCustomerName = foundCustomer.name;
    } else if (customer?.trim()) {
      resolvedCustomerName = customer.trim();
    }

    const totalRevenue = quantity * unitPrice;
    const sale = await Sale.create({
      product,
      customerId: resolvedCustomerId,
      quantity,
      unitPrice,
      totalRevenue,
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

router.delete("/:id", async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) return res.status(404).json({ message: "Khong tim thay" });
  const p = await Product.findById(sale.product);
  if (p) {
    p.stockQty += sale.quantity;
    await p.save();
  }
  await sale.deleteOne();
  res.json({ message: "Da xoa don ban" });
});

export default router;
