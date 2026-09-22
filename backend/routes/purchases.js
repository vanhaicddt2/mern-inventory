import express from "express";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const { product } = req.query;
  const filter = product ? { product } : {};
  const purchases = await Purchase.find(filter).populate("product", "name").populate("supplierId", "name phone email").sort("-date");
  res.json(purchases);
});

// Nhap hang: tang ton kho + cap nhat gia von binh quan
router.post("/", async (req, res) => {
  try {
    const { product, quantity, unitCost, supplier, supplierId, date, note } = req.body;
    const totalCost = quantity * unitCost;

    let resolvedSupplierId = null;
    let resolvedSupplierName = "NCC lẻ";

    if (supplierId) {
      const foundSupplier = await Supplier.findById(supplierId);
      if (!foundSupplier) return res.status(404).json({ message: "Khong tim thay nha cung cap" });
      resolvedSupplierId = foundSupplier._id;
      resolvedSupplierName = foundSupplier.name;
    } else if (supplier?.trim()) {
      resolvedSupplierName = supplier.trim();
    }

    const purchase = await Purchase.create({
      product,
      supplierId: resolvedSupplierId,
      quantity,
      unitCost,
      totalCost,
      supplier: resolvedSupplierName,
      date,
      note,
      createdBy: req.user._id,
    });

    const p = await Product.findById(product);
    if (p) {
      const newStock = p.stockQty + Number(quantity);
      // gia von binh quan gia quyen
      const newAvgCost =
        newStock > 0
          ? (p.costPrice * p.stockQty + totalCost) / newStock
          : unitCost;
      p.stockQty = newStock;
      p.costPrice = Math.round(newAvgCost);
      await p.save();
    }

    res.status(201).json(purchase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Khong tim thay phieu nhap" });

    const { quantity, unitCost, supplierId, supplier, date, note } = req.body;
    const nextQuantity = Number(quantity);
    const nextUnitCost = Number(unitCost);

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return res.status(400).json({ message: "So luong phai lon hon 0" });
    }
    if (!Number.isFinite(nextUnitCost) || nextUnitCost < 0) {
      return res.status(400).json({ message: "Don gia nhap khong hop le" });
    }

    let resolvedSupplierId = null;
    let resolvedSupplierName = "NCC lẻ";
    if (supplierId) {
      const foundSupplier = await Supplier.findById(supplierId);
      if (!foundSupplier) return res.status(404).json({ message: "Khong tim thay nha cung cap" });
      resolvedSupplierId = foundSupplier._id;
      resolvedSupplierName = foundSupplier.name;
    } else if (supplier?.trim()) {
      resolvedSupplierName = supplier.trim();
    }

    const product = await Product.findById(purchase.product);
    if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

    const nextStockQty = product.stockQty + nextQuantity - purchase.quantity;
    if (nextStockQty < 0) {
      return res.status(400).json({ message: "So luong moi vuot qua ton kho hien tai" });
    }
    product.stockQty = nextStockQty;
    purchase.quantity = nextQuantity;
    purchase.unitCost = nextUnitCost;
    purchase.totalCost = nextQuantity * nextUnitCost;
    purchase.supplierId = resolvedSupplierId;
    purchase.supplier = resolvedSupplierName;
    if (date) purchase.date = date;
    purchase.note = note || "";

    await purchase.save();

    const purchases = await Purchase.find({ product: product._id });
    const totalQuantity = purchases.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = purchases.reduce((sum, item) => sum + item.totalCost, 0);
    product.costPrice = totalQuantity > 0 ? Math.round(totalCost / totalQuantity) : 0;
    await product.save();

    res.json(purchase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) return res.status(404).json({ message: "Khong tim thay" });
  const p = await Product.findById(purchase.product);
  if (p) {
    p.stockQty = Math.max(0, p.stockQty - purchase.quantity);
    await p.save();
  }
  await purchase.deleteOne();
  res.json({ message: "Da xoa phieu nhap" });
});

export default router;
