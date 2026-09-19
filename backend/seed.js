// Chay: node seed.js  ->  tao san 3 danh muc mac dinh: Phone / Man hinh / Other
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Category from "./models/Category.js";

dotenv.config();

const defaultCategories = [
  { name: "Phone", slug: "phone", icon: "smartphone", color: "#6366f1", description: "Điện thoại di động các loại" },
  { name: "Màn hình", slug: "man-hinh", icon: "monitor", color: "#22c55e", description: "Màn hình máy tính, laptop" },
  { name: "Other", slug: "other", icon: "package", color: "#f59e0b", description: "Phụ kiện và sản phẩm khác" },
];

const run = async () => {
  await connectDB();
  for (const cat of defaultCategories) {
    const exists = await Category.findOne({ slug: cat.slug });
    if (!exists) {
      await Category.create(cat);
      console.log(`✅ Đã tạo danh mục: ${cat.name}`);
    } else {
      console.log(`⏭️  Danh mục đã tồn tại: ${cat.name}`);
    }
  }
  console.log("🎉 Seed hoàn tất");
  mongoose.connection.close();
};

run();
