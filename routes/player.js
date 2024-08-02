import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from "dotenv";
import moment from 'moment-timezone';


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


//get rewards
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

    const wayspotName = req.query['wayspot-name'];

    const currentDate = moment().tz("Asia/Jakarta").format('YYYY-MM-DD');

    const resetResult = await client.query("SELECT last_reset_date FROM reset_log WHERE id = 1");
    const lastResetDate = moment(resetResult.rows[0].last_reset_date).tz("Asia/Jakarta").format('YYYY-MM-DD');
    if (currentDate !== lastResetDate) {
      await client.query("DELETE FROM wayspots");

      await client.query("UPDATE reset_log SET last_reset_date = $1 WHERE id = 1", [currentDate]);
    }

    const result = await client.query("SELECT * FROM wayspots WHERE wayspot_name = $1 AND user_id = $2", [wayspotName, userId]);

    if (result.rows.length === 0) {
      try {
        await client.query("INSERT INTO wayspots (wayspot_name,found_at, user_id) VALUES ($1, $2, $3)", [wayspotName, currentDate ,userId]);
        await client.query("UPDATE users SET exp = exp + 5 WHERE id = $1", [userId]);
        res.status(200).json({ message: "Wayspot found", timestamp: moment().tz("Asia/Jakarta").format() });
      } catch (err) {
        console.error('Error in adding wayspot:', err);
        res.status(500).json({ message: err.message });
      }
    } else {
      res.status(200).json({ message: "Wayspot already found", timestamp: moment().tz("Asia/Jakarta").format() });
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
    const currentDate = moment().tz("Asia/Jakarta").format('YYYY-MM-DD');
    const result = await client.query(
      "SELECT * FROM wayspots WHERE user_id = $1 AND DATE(found_at) = $2",
      [userId, currentDate]
    );

    res.status(200).json({ wayspots: result.rows,currentDate: currentDate });
  } catch (err) {
    console.error('Error fetching wayspots:', err);
    res.status(500).json({ message: err.message });
  }
});

export default player;
