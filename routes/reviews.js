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
const reviews = express();
reviews.set('trust proxy', true);
env.config();
reviews.use(cors(corsOptions));
reviews.use(express.json());
reviews.use(express.urlencoded({ extended: true }));
reviews.use(cookieParser());
reviews.use(dbMiddleware); 

//post a review
reviews.post("/api/text-reviews", async (req, res) => {
  const client = req.dbClient;
  const { umkms_id, user_review } = req.body;
  try {
    const result = await client.query("INSERT INTO text_reviews (umkms_id, user_review) VALUES ($1, $2)", [umkms_id, user_review]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Data inserted successfully' });
    } else {
      res.status(400).json({ message: 'Data not inserted' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})
//get reviews by umkm name
reviews.get("/api/text-reviews", async (req, res) => {
  const client = req.dbClient;
  const umkmName = req.query["wayspot"];
  try{
    const result = await client.query("SELECT t.id, t.umkms_id, t.user_review FROM text_reviews t JOIN umkms u ON u.id = t.umkms_id WHERE nama = $1", [umkmName]);
    if (result.rows.length > 0) {
      res.status(200).json({ reviews: result.rows });
    }
    else if (result.rows.length == 0) {
      res.status(404).json({ message: "No data found" });
    }
    else {
      res.status(404).json({ message: "Data not found" });
    }
  }
  catch(err){

  }
})
// prep
// INSERT INTO text_reviews (umkms_id, user_review) VALUES ((SELECT id FROM umkms WHERE nama = 'Name_of_UKM'), 'Your review text here');
// WIP 
reviews.get("/api/video-reviews/:umkmid", async (req, res) => {
  const client = req.dbClient;
  const umkmid = req.params.umkmid;
  try{
    const result = await client.query("SELECT * FROM video_reviews WHERE umkm_id = $1", [umkmid]);
    if (result.rows.length > 0) {
      res.status(200).json({ reviews: result.rows });
    }
    else if (result.rows.length == 0) {
      res.status(404).json({ message: "No data found" });
    }
    else {
      res.status(404).json({ message: "Data not found" });
    } 

  }
  catch(err){

  }
})

export default reviews;