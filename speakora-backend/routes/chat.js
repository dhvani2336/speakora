const express = require("express");
const router = express.Router();
const geminiService = require("../services/geminiService");

// GET fallback
router.get("/", (req, res) => {
  res.json({ message: "Use POST method to send a chat message" });
});

// POST /api/chat
router.post("/", async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await geminiService.generateResponse(message);

    res.json({ reply: reply.trim() });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "AI service error", details: error.message });
  }
});

module.exports = router;
