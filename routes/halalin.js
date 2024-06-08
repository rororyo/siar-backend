import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from "dotenv";

const halalin = express();
// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://4x9br3l0-3000.asse.devtunnels.ms"
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
};
env.config();
halalin.use(cors(corsOptions));
halalin.use(express.json());
halalin.use(express.urlencoded({ extended: true }));
halalin.use(cookieParser());
halalin.use(dbMiddleware);

halalin.post("/api/halalin", async (req, res) => {
  const client = req.dbClient;
  const { nama, lat, long, nomor_telp } = req.body;

  try {
    const result = await client.query(
      "INSERT INTO umkms (nama, lat, long, nomor_telp) VALUES ($1, $2, $3, $4) RETURNING *",
      [nama, parseFloat(lat), parseFloat(long), nomor_telp]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Data inserted successfully' });
    } else {
      res.status(400).json({ message: 'Data not inserted' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default halalin;