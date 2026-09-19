import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ message: "Nguoi dung khong ton tai" });
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Token khong hop le hoac da het han" });
    }
  }
  return res.status(401).json({ message: "Khong co quyen truy cap, vui long dang nhap" });
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Chi admin moi co quyen thuc hien hanh dong nay" });
  }
  next();
};
