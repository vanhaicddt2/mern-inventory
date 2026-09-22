import express from "express";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const { search } = req.query;
  const filter = { isRetailGuest: { $ne: true } };

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }

  const customers = await Customer.find(filter).sort("name").lean();
  const customerIds = customers.map((customer) => customer._id);
  const salesStats = await Sale.aggregate([
    { $match: { customerId: { $in: customerIds } } },
    {
      $group: {
        _id: "$customerId",
        purchaseCount: { $sum: 1 },
        totalSpent: { $sum: "$totalRevenue" },
      },
    },
  ]);
  const statsByCustomer = new Map(salesStats.map((stats) => [String(stats._id), stats]));

  res.json(customers.map((customer) => ({
    ...customer,
    purchaseCount: statsByCustomer.get(String(customer._id))?.purchaseCount || 0,
    totalSpent: statsByCustomer.get(String(customer._id))?.totalSpent || 0,
  })));
});

router.get("/:id/history", async (req, res) => {
  const customer = await Customer.findById(req.params.id).select("name");
  if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });

  const sales = await Sale.find({ customerId: customer._id })
    .populate("product", "name sku")
    .sort("-date")
    .lean();
  res.json({ customer, sales });
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address, note } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Ten khach hang la bat buoc" });

    const customer = await Customer.create({
      name: name.trim(),
      phone: String(phone || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      address: String(address || "").trim(),
      note: String(note || "").trim(),
    });

    res.status(201).json(customer);
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

    const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });

    await Sale.updateMany({ customerId: customer._id }, { $set: { customer: customer.name } });

    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: "Khong tim thay khach hang" });

  await Sale.updateMany({ customerId: customer._id }, { $set: { customerId: null, customer: "Khách lẻ" } });
  await customer.deleteOne();

  res.json({ message: "Da xoa khach hang" });
});

export default router;
