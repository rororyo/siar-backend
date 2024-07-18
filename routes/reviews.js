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
//get all video reviews
reviews.get("/api/video-reviews", async (req, res) => {
  const client = req.dbClient;
  try{
    const result = await client.query("select video_reviews.*,users.email,users.username from video_reviews join users on user_id = users.id");
    if(result.rows.length > 0){
      res.status(200).json({ reviews: result.rows });
    }
    else{
      res.status(404).json({ message: "Data not found" });
    }
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
})

//get video reviews by id
reviews.get("/api/video-reviews/:videoId", async (req, res) => {
  const client = req.dbClient;
  const videoId = req.params.videoId;
  try{
    const result = await client.query("select video_reviews.*,users.id,users.email,users.username,users.rank,umkms.id,umkms.nama  from video_reviews join users on user_id = users.id join umkms on umkms_id = umkms.id  where video_reviews.id = $1", [videoId]);
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
    res.status(500).json({ message: err.message });
  }
})
//get video likes
reviews.get("/api/video-review/likes/:reviewId", async (req, res) => {
  const client = req.dbClient;
  const reviewId = req.params.reviewId;
  try{
    const result = await client.query("select count(*) as like_count from likes where video_id = $1", [reviewId])
    res.status(200).json({ likes: result.rows });
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
})

//like video review
reviews.post("/api/video-review/like", async (req, res) => {
  const { userId, postId } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO likes (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [userId, postId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

})
//unlike video review
reviews.post ("/api/video-review/unlike", async (req, res) => {
  const { userId, postId } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND video_id = $2 RETURNING *',
      [userId, postId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

export default reviews;