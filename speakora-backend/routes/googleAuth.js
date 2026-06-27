const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");

// GET fallback
router.get("/google", (req, res) => {
  res.json({ message: "Use POST method with Google credential token" });
});

// POST /api/auth/google
router.post("/google", googleAuthController.googleLogin);

// GET /api/auth/config — expose Google client ID to frontend
router.get("/config", (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ""
  });
});

module.exports = router;
