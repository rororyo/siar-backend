import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from "dotenv";

const player = express();
env.config();
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
env.config();
authApp.use(cors(corsOptions));
player.use(express.json());
player.use(express.urlencoded({ extended: true }));
player.use(cookieParser());
player.use(dbMiddleware);
player.get("/api/current-user", async (req, res) => {
  const client = req.dbClient;
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  else{
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      const result = await client.query("SELECT * FROM users WHERE id = $1", [userId]);
      if (result.rows.length > 0) {
        res.status(200).json({ user: result.rows[0] });
      } else {
        res.status(404).json({ message: "User Not Found" });
      }
    } catch (err) {
      console.error('Error in current user:', err);
      res.status(500).json({ message: err.message });
    }
  }
})
player.get("/api/get-rewards/:userId", async (req, res) => {
  const userId = req.params.userId;
  const client = req.dbClient;
  try{
    await client.query("UPDATE users SET exp = exp + 5 WHERE id = $1", [userId])
    res.status(200).json({message: "exp sucessfuly added"})
  }
  catch(err){
    console.log(err)
    res.status(500).json({message: err.message})
  }
  
})

export default player