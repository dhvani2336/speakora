const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

require("dotenv").config({ path: __dirname + "/.env" });

// Fix MongoDB DNS issues
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with error handling
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI environment variable is not set.");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((err) => console.error("MongoDB Connection Error:", err.message));

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting reconnect...");
  });
}

// Routes
app.use("/api/user", require("./routes/user"));
app.use("/api/auth", require("./routes/googleAuth"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/lessons", require("./routes/lesson"));
app.use("/api/grammar", require("./routes/grammar"));
app.use("/api/speaking", require("./routes/speaking"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/pronunciation", require("./routes/pronunciation"));
app.use("/api/tips", require("./routes/tips"));
app.use("/api/worksheets", require("./routes/worksheets"));
app.use("/api/vocab", require("./routes/vocab"));
app.use("/api/sentence", require("./routes/sentence"));
app.use("/api/listening", require("./routes/listening"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Serve frontend files (for local dev — Vercel handles static files via vercel.json)
app.use(express.static(path.join(__dirname, "../"), { index: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../home.html"));
});

// Centralized error handler
app.use(require("./middlewares/errorMiddleware"));

// Port Configuration
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
  });
}

module.exports = app;