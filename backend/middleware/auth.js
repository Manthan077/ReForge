import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });
    
    req.user = { id: user._id, email: user.email, name: user.name, dob: user.dob, photo: user.photo };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
