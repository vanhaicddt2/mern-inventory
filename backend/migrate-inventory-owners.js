import dotenv from "dotenv";
import mongoose from "mongoose";
import { isDeepStrictEqual } from "node:util";
import Category from "./models/Category.js";
import Customer from "./models/Customer.js";
import Expense from "./models/Expense.js";
import Product from "./models/Product.js";
import Purchase from "./models/Purchase.js";
import Sale from "./models/Sale.js";
import Supplier from "./models/Supplier.js";
import User from "./models/User.js";

dotenv.config();
mongoose.set("autoIndex", false);

const models = [Category, Product, Purchase, Sale, Expense, Customer, Supplier];
const legacyUniqueFields = new Map([
  [Category, ["name", "slug"]],
  [Product, ["sku"]],
  [Customer, ["phone", "email"]],
  [Supplier, ["phone", "email"]],
]);

const run = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("Can cau hinh MONGO_URI hoac MONGODB_URI");
  await mongoose.connect(mongoUri);
  const owner = await User.findOne({ role: "admin" }).sort("createdAt");
  if (!owner) throw new Error("Khong tim thay tai khoan admin de nhan du lieu cu");

  for (const [model, fields] of legacyUniqueFields) {
    const indexes = await model.collection.indexes().catch((error) => {
      if (error.codeName === "NamespaceNotFound") return [];
      throw error;
    });
    for (const index of indexes) {
      const keys = Object.keys(index.key || {});
      if (index.unique && keys.length === 1 && fields.includes(keys[0])) {
        await model.collection.dropIndex(index.name);
      }
    }
  }

  for (const model of models) {
    const result = await model.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: owner._id } }
    );
    console.log(`${model.modelName}: assigned ${result.modifiedCount} legacy records`);

    const incorrectlyTypedOwners = await model.collection
      .find({ $or: [{ "owner.$oid": { $type: "string" } }, { owner: { $type: "string" } }] })
      .toArray();
    const ownerRepairs = incorrectlyTypedOwners.flatMap((document) => {
      const ownerId = typeof document.owner === "string" ? document.owner : document.owner?.$oid;
      if (!mongoose.isValidObjectId(ownerId)) return [];
      return [{
        updateOne: {
          filter: { _id: document._id },
          update: { $set: { owner: new mongoose.Types.ObjectId(ownerId) } },
        },
      }];
    });
    if (ownerRepairs.length) await model.collection.bulkWrite(ownerRepairs);
    console.log(`${model.modelName}: normalized ${ownerRepairs.length} owner values`);
  }

  for (const model of models) {
    const existingIndexes = await model.collection.indexes().catch((error) => {
      if (error.codeName === "NamespaceNotFound") return [];
      throw error;
    });
    for (const [keys, options] of model.schema.indexes()) {
      const name = options.name || Object.entries(keys).map(([key, value]) => `${key}_${value}`).join("_");
      const existing = existingIndexes.find((index) => index.name === name);
      if (!existing) continue;

      const optionsMatch =
        isDeepStrictEqual(existing.key, keys) &&
        Boolean(existing.unique) === Boolean(options.unique) &&
        Boolean(existing.sparse) === Boolean(options.sparse) &&
        isDeepStrictEqual(existing.partialFilterExpression, options.partialFilterExpression);
      if (!optionsMatch) await model.collection.dropIndex(name);
    }
    await model.createIndexes();
  }
  console.log(`Inventory data assigned to admin ${owner.email}`);
};

run()
  .catch((error) => {
    console.error(`Inventory owner migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());