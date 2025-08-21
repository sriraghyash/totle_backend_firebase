import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/UserRoutes/auth.routes.js";
import userRoutes from "./routes/UserRoutes/user.routes.js";
import adminRoutes from "./routes/UserRoutes/admin.routes.js";
import languageRoutes from './routes/languages.routes.js';
import catalogueRoutes from './routes/CatalogRoutes/catalogue.routes.js';
import testRoutes from "./routes/test.routes.js";
import streamRoutes from "./routes/SessionStreamRoutes/stream.routes.js";
import sessionRoutes from "./routes/SessionRoutes/session.routes.js";
import paymentRoutes from "./routes/PaymentRoutes/Payment.route.js";
import uploadRoutes from './routes/upload.js';
import teachRoutes from "./routes/teach.routes.js";
import ctaRoutes from "./routes/cta.js";
import platformCtaRoutes from "./routes/platformCta.routes.js";
import FeedbackRoutes from "./routes/feedback.routes.js";
import objectiveRoutes from './routes/Objectives/objective.routes.js';
import keyResultRoutes from './routes/Objectives/keyresult.routes.js';
import progressRoutes from "./routes/progressTracker.routes.js";
import insights from "./routes/insights.routes.js";
import endeavourRoutes from "./routes/endeavour.js";

import { defineModelRelationships, syncDatabase } from './config/syncDb.js';

// ✅ Optional: Import Redis client if you are using it in other modules
import redis from "redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// ------------------- Middlewares -------------------
app.use("/uploads", express.static(path.resolve("src/uploads")));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: [
      'totle.co','www.totle.co','https://totle.co','https://www.totle.co',
      'https://totle.netlify.app','https://totlenucleus.netlify.app',
      'https://mail.google.com','http://localhost:3001','http://localhost:3000','http://localhost:5173'
    ],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// ------------------- Routes -------------------
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/languages", languageRoutes);
app.use("/api/languages", languageRoutes);
app.use("/admin", adminRoutes);
app.use("/api", ctaRoutes);
app.use("/api", platformCtaRoutes);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/teach", teachRoutes);
app.use("/api/feedback", FeedbackRoutes);
app.use("/api/objectives", objectiveRoutes);
app.use("/api/objectives", keyResultRoutes);
app.use("/api/teach", insights);
app.use("/api/progress", progressRoutes);
app.use('/', uploadRoutes);
app.use("/api/nucleus/endeavour/items", endeavourRoutes);

app.get("/", (req, res) => {
  res.send("✅ TOTLE Backend API is running!");
});

// ------------------- Redis Setup (Safe) -------------------
let redisClient;
(async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    });
    redisClient.on("error", (err) => {
      console.error("❌ Redis connection error:", err.message);
    });
    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });
    await redisClient.connect();
  } catch (err) {
    console.error("⚠️ Redis not available, continuing without it");
  }
})();

// ------------------- Start Server -------------------
const startServer = async () => {
  try {
    await syncDatabase();

    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: [
          'totle.co','www.totle.co','https://totle.co','https://www.totle.co',
          'https://totle.netlify.app','https://totlenucleus.netlify.app',
          'https://mail.google.com','http://localhost:3001','http://localhost:3000'
        ],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"],
      },
    });
    global.io = io;

    io.on("connection", (socket) => {
      console.log("🔌 WebSocket connected:", socket.id);

      socket.on("join", ({ sessionId, userId, role }) => {
        socket.join(sessionId);
        console.log(`🟢 ${role} ${userId} joined session ${sessionId}`);
      });

      socket.on("signal", ({ sessionId, userId, type, data }) => {
        console.log(`📡 Signal ${type} from ${userId} in session ${sessionId}`);
        socket.to(sessionId).emit("signal", { sessionId, userId, type, data });
      });

      socket.on("hangup", ({ sessionId, userId }) => {
        console.log(`🔴 Hangup by ${userId} in session ${sessionId}`);
        socket.to(sessionId).emit("hangup");
      });

      socket.on("disconnect", () => {
        console.log("❌ WebSocket disconnected:", socket.id);
      });
    });

    server.listen(PORT, () =>
      console.log(`🚀 Server running with WebSocket on port ${PORT}`)
    );
  } catch (error) {
    console.error("❌ Error during startup:", error);
  }
};

startServer();

// ------------------- Global Error Handlers -------------------
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception:", err);
});
