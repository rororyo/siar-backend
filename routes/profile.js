import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from "dotenv";
// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://4x9br3l0-3000.asse.devtunnels.ms",
  "https://halal-hunter.vercel.app",
  "https://4mwqv6dl-3000.asse.devtunnels.ms",
  "https://g562f42v-3000.asse.devtunnels.ms"
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
const profile = express();
profile.set('trust proxy', true);
env.config();
profile.use(cors(corsOptions));
profile.use(express.json());
profile.use(express.urlencoded({ extended: true }));
profile.use(cookieParser());
profile.use(dbMiddleware); 
//get profile information
profile.get("/api/profile/:profileId", async (req, res) => {
    const client = req.dbClient;
    const profileId = req.params.profileId;
    try {
      const result = await client.query(
        `SELECT 
          users.email, 
          users.username, 
          COUNT(likes.id) AS like_count, 
          (SELECT COUNT(*) FROM follows WHERE follows.follow_id = users.id) AS follower_count,
          (SELECT COUNT(*) FROM video_reviews WHERE video_reviews.user_id = users.id) AS review_count
        FROM users 
        LEFT JOIN likes ON likes.user_id = users.id 
        WHERE users.id = $1 
        GROUP BY users.email, users.username, users.id`,
        [profileId]
      );
      if (result.rows.length > 0) {
        res.status(200).json({ profile: result.rows[0] });
      } else {
        res.status(404).json({ message: "Data not found" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  profile.get("/api/profile/video/:profileId", async (req, res) => {
    const client = req.dbClient;
    const profileId = req.params.profileId;
    try {
      const result = await client.query(
        "SELECT * FROM video_reviews WHERE user_id = $1",
        [profileId]
      );
      if (result.rows.length > 0) {
        res.status(200).json({ profile: result.rows });
      } else {
        res.status(200).json({ message: "No video uploaded yet" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
//get liked video
profile.get("/api/profile/likes/:profileId", async (req, res) => {
  const client = req.dbClient;
  const profileId = req.params.profileId;
  try {
    const result = await client.query(
      "select video_id,thumbnail_path from likes join video_reviews on video_id = video_reviews.id where likes.user_id = $1",
      [profileId]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ profile: result.rows });
    } else {
      res.status(200).json({ message: "No video liked yet" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default profile