import express from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import env from "dotenv";
import bodyParser from "body-parser";
import authApp from "./routes/auth.js";
import { dbMiddleware } from "./routes/dbsetup.js";
import cookieParser from "cookie-parser";
import halalin from "./routes/halalin.js";
import homepage from "./routes/homepage.js";
import player from "./routes/player.js";
// Constants
const app = express();
const port = 4000;
app.set('trust proxy', true);
// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://4x9br3l0-3000.asse.devtunnels.ms",
  "https://halal-hunter.vercel.app",
  "https://4mwqv6dl-3000.asse.devtunnels.ms",
];
// Dynamic CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Check if the origin is in the allowedOrigins list or if there's no origin (like for same-origin requests)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
// Middlewares
env.config();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(dbMiddleware);
app.use(cookieParser());
app.use(authApp);
app.use(halalin);
app.use(homepage);
app.use(player)

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// Create HTTPS server
app.listen(
  port,
  process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
  () => {
    console.log(`Server is running on port ${port}`);
  }
);
