import express from "express";
import Supplier from "../models/Supplier.js";
import Purchase from "../models/Purchase.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }

  const suppliers = await Supplier.find(filter).sort("name");
  res.json(suppliers);
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address, note } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Ten nha cung cap la bat buoc" });

    const supplier = await Supplier.create({
      name: name.trim(),
      phone: String(phone || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      address: String(address || "").trim(),
      note: String(note || "").trim(),
    });

    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, phone, email, address, note } = req.body;
    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    if (email !== undefined) update.email = String(email).trim().toLowerCase();
    if (address !== undefined) update.address = String(address).trim();
    if (note !== undefined) update.note = String(note).trim();

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!supplier) return res.status(404).json({ message: "Khong tim thay nha cung cap" });

    await Purchase.updateMany({ supplierId: supplier._id }, { $set: { supplier: supplier.name } });

    res.json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: "Khong tim thay nha cung cap" });

  await Purchase.updateMany({ supplierId: supplier._id }, { $set: { supplierId: null, supplier: "NCC lẻ" } });
  await supplier.deleteOne();

  res.json({ message: "Da xoa nha cung cap" });
});

export default router;
