import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import franchisesRoutes from "./routes/franchises.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import remindersRoutes from "./routes/reminders.routes.js";
import usersRoutes from "./routes/users.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import { startReminderScheduler } from "./jobs/reminderScheduler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { JSON_BODY_LIMIT } from "./config/security.js";

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const devOrigins = ["http://localhost:5173", "http://localhost:4173"];
const allowedOrigins = isProduction
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [process.env.FRONTEND_URL, ...devOrigins].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, !isProduction);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "Dispatch Ledger API", health: "/api/health" });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/franchises", franchisesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reminders", remindersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  startReminderScheduler();
});
