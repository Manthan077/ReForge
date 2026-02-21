import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    
    res.json({ 
      token,
      user: { id: user._id, email: user.email, name: user.name },
      message: "Account created successfully!" 
    });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, dob, photo } = req.body;
    
    console.log("Profile update request:", { userId: req.user.id, name, dob, photoLength: photo?.length });
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("User not found:", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (dob !== undefined) user.dob = dob;
    if (photo !== undefined) user.photo = photo;
    
    await user.save();
    
    console.log("Profile updated successfully");
    
    res.json({
      user: { id: user._id, email: user.email, name: user.name, dob: user.dob, photo: user.photo }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Profile update failed" });
  }
});

export default router;
