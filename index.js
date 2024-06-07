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

// Constants
const app = express();
const port = 4000;

// SSL options
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};
// List of allowed origins
const allowedOrigins = [
  "master-hadziq.dev.8thwall.app/gemastik-siar-halal",
  "hadziq.8thwall.app/gemastik-siar-halal/",
  "https://hadziq.staging.8thwall.app"
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

// Routes
app.get("/", (req, res) => {
  console.log("API hit");
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
