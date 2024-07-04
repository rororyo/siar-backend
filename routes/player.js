import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from "dotenv";

const player = express();
player.set('trust proxy', true);
dotenv.config();

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
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

player.use(cors(corsOptions));
player.use(express.json());
player.use(express.urlencoded({ extended: true }));
player.use(cookieParser());
player.use(dbMiddleware);

player.get("/api/current-user", async (req, res) => {
  const client = req.dbClient;
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Split the token from 'Bearer TOKEN_VALUE'
  const token = tokenHeader.split(' ')[1]; 
  // Now check if the token was actually split and exists
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;
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
});


player.get("/api/get-rewards", async (req, res) => {
  const tokenHeader = req.headers.authorization;
  const client = req.dbClient;

  if (!tokenHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = tokenHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;

    // Debugging: Log the user ID

    const wayspotName = req.query['wayspot-name'];

    // Check the current date in UTC
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    // Get the last reset date from reset_log
    const resetResult = await client.query("SELECT last_reset_date FROM reset_log WHERE id = 1");
    const lastResetDate = new Date(resetResult.rows[0].last_reset_date);
    
    // Add one day to the last reset date
    lastResetDate.setDate(lastResetDate.getDate() + 1);
    const adjustedLastResetDate = lastResetDate.toISOString().slice(0, 10);


    if (currentDate !== adjustedLastResetDate) {
      // Delete all rows from the wayspots table if the date has changed
      await client.query("DELETE FROM wayspots");

      // Update the reset_log with the new reset date
      await client.query("UPDATE reset_log SET last_reset_date = $1 WHERE id = 1", [currentDate]);
    }

    // Query database to check if wayspot has been found within the current day
    const result = await client.query("SELECT * FROM wayspots WHERE wayspot_name = $1 AND user_id = $2", [wayspotName, userId]);

    if (result.rows.length === 0) {
      try {
        // Insert wayspot into database (found_at column will automatically use current_timestamp)
        await client.query("INSERT INTO wayspots (wayspot_name, user_id) VALUES ($1, $2)", [wayspotName, userId]);

        // Update user's experience
        await client.query("UPDATE users SET exp = exp + 5 WHERE id = $1", [userId]);

        // Respond with success message
        res.status(200).json({ message: "Wayspot found" });
      } catch (err) {
        console.error('Error in adding wayspot:", err');
        res.status(500).json({ message: err.message });
      }
    } else {
      // Wayspot already found within the current day
      res.status(200).json({ message: "Wayspot already found" });
    }
  } catch (err) {
    console.error('Error in verifying token:', err);
    res.status(500).json({ message: err.message });
  }
});

player.get("/api/found-wayspots", async (req, res) => {
  const client = req.dbClient;
  const tokenHeader = req.headers.authorization;

  if (!tokenHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = tokenHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;

    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().slice(0, 10);

    // Query to get all wayspots found on the same day
    const result = await client.query(
      "SELECT * FROM wayspots WHERE user_id = $1 AND DATE(found_at) = $2",
      [userId, currentDate]
    );

    res.status(200).json({ wayspots: result.rows });
  } catch (err) {
    console.error('Error fetching wayspots:', err);
    res.status(500).json({ message: err.message });
  }
});

export default player;
