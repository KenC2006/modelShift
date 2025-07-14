const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const { getGeneralRateLimits } = require("./config/rateLimits");
require("dotenv").config();

const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "https://modelshift-bbcd8.web.app",
        "https://modelshift-bbcd8.firebaseapp.com",
        "https://modelshift-frontend.vercel.app",
        "https://modelshift.vercel.app",
        "https://modelshift-backend.vercel.app",
        ...(origin &&
        origin.match(
          /^https:\/\/modelshift-backend-[a-z0-9\-]+-kenchenyan2006-gmailcoms-projects\.vercel\.app$/
        )
          ? [origin]
          : []),
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV === "development" &&
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          "https://www.gstatic.com",
          "https://www.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "https://www.googleapis.com"],
        connectSrc: [
          "'self'",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

const generalLimits = getGeneralRateLimits();
const limiter = rateLimit({
  windowMs: generalLimits.WINDOW_MS,
  max: generalLimits.MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  if (req.body && req.body.message) {
    req.body.message = req.body.message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }
  next();
});

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authentication token",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {});
}

module.exports = app;
