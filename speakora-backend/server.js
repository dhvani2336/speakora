const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

require("dotenv").config({ path: __dirname + "/.env" });

// Fix MongoDB DNS resolution on Vercel
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB Connection (Vercel serverless-compatible) ──
const MONGO_URI = process.env.MONGO_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  if (!MONGO_URI) {
    console.error("FATAL: MONGO_URI environment variable is not set.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });
    isConnected = true;
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    isConnected = false;
    console.error("MongoDB Connection Error:", err.message);
  }
}

mongoose.connection.on("error", (err) => {
  isConnected = false;
  console.error("MongoDB runtime error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("connected", () => {
  isConnected = true;
});

// Connect immediately
connectDB();

// Ensure connection on every request (serverless cold start safety)
app.use(async (req, res, next) => {
  if (!isConnected && MONGO_URI) {
    await connectDB();
  }
  next();
});

// ── Routes ──
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

// ── Health Check ──
app.get("/api/health", (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    status: "ok",
    mongo: states[mongoState] || "unknown",
    timestamp: new Date().toISOString()
  });
});

// Serve frontend files (local dev only — Vercel handles static via vercel.json)
app.use(express.static(path.join(__dirname, "../"), { index: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../home.html"));
});

// ── Centralized Error Handler ──
app.use(require("./middlewares/errorMiddleware"));

// ── Local Development Server ──
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
  });
}

module.exports = app;