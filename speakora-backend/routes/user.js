const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ── GET fallback for POST-only routes ── */
router.get("/register", (req, res) => {
  res.json({ message: "Use POST method to register" });
});

router.get("/login", (req, res) => {
  res.json({ message: "Use POST method to login" });
});

/* ── REGISTER ── */
router.post("/register", async (req, res, next) => {
  try {
    let { name, username, email, phone, password, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check duplicate username
    if (username) {
      const existingUsername = await User.findOne({ username: username.trim() });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username: username ? username.trim() : undefined,
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      password: hashedPassword,
      languages: language ? [language] : []
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    next(err);
  }
});

/* ── LOGIN ── */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password" });
    }

    // Find user (case-insensitive)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") }
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      phone: user.phone || "",
      languages: user.languages,
      picture: user.picture || "",
      subscription: user.subscription,
      token
    });

  } catch (err) {
    next(err);
  }
});

/* ── UPDATE LANGUAGE ── */
router.post("/update-language", async (req, res, next) => {
  try {
    const { userId, language } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.languages.length >= 3) {
      return res.status(400).json({ message: "Max 3 languages" });
    }

    if (!user.languages.includes(language)) {
      user.languages.push(language);
    }

    await user.save();
    res.json({ languages: user.languages });

  } catch (err) {
    next(err);
  }
});

/* ── GET PROFILE ── */
router.get("/profile/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/* ── UPDATE PROFILE ── */
router.put("/profile/:id", async (req, res, next) => {
  try {
    const { name, username, phone } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (username) user.username = username.trim();
    if (phone) user.phone = phone.trim();

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      phone: user.phone || "",
      languages: user.languages,
      picture: user.picture || "",
      subscription: user.subscription
    });
  } catch (err) {
    next(err);
  }
});

/* ── CERTIFICATE DATA ── */
router.get("/certificate/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("name languages");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
