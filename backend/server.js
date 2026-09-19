import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST = path.join(__dirname, "../frontend/dist");

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import purchaseRoutes from "./routes/purchases.js";
import saleRoutes from "./routes/sales.js";
import expenseRoutes from "./routes/expenses.js";
import statsRoutes from "./routes/stats.js";
import customerRoutes from "./routes/customers.js";
import supplierRoutes from "./routes/suppliers.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Inventory API dang chay 🚀" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);

// Serve built frontend in production
if (process.env.NODE_ENV === "production") {
  const { existsSync } = await import("fs");
  if (existsSync(DIST)) {
    app.use(express.static(DIST));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(DIST, "index.html"));
    });
  } else {
    console.warn("⚠️  Frontend dist not found. Run: npm run build");
    app.use((req, res) => res.status(404).json({ message: "Frontend build not found. Run: npm run build" }));
  }
} else {
  // Dev: 404 handler for API only
  app.use((req, res) => res.status(404).json({ message: "Khong tim thay endpoint" }));
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Loi server", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chay tai http://localhost:${PORT}`));
