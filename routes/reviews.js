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

// Get like state
reviews.get("/api/video-review/like-state/:reviewId/:userId", async (req, res) => {
  const client = req.dbClient;
  const { reviewId, userId } = req.params;
  try {
    const result = await client.query("SELECT * FROM likes WHERE video_id = $1 AND user_id = $2", [reviewId, userId]);
    if (result.rows.length > 0) {
      res.status(200).json({ liked: true });
    } else {
      res.status(200).json({ liked: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Like video review
reviews.post("/api/video-review/like", async (req, res) => {
  const { userId, postId } = req.body;
  const client = req.dbClient;

  try {
    const result = await client.query(
      'INSERT INTO likes (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [userId, postId]
    );
    if (result.rows.length === 0) {
      const existingLike = await client.query(
        'SELECT * FROM likes WHERE user_id = $1 AND video_id = $2',
        [userId, postId]
      );
      res.status(200).json({ data: existingLike.rows[0], message: "Already liked" });
    } else {
      res.status(200).json({ data: result.rows[0], message: "Liked" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Unlike video review
reviews.post("/api/video-review/unlike", async (req, res) => {
  const { userId, postId } = req.body;
  const client = req.dbClient;
  
  try {
    const result = await client.query(
      'DELETE FROM likes WHERE user_id = $1 AND video_id = $2 RETURNING *',
      [userId, postId]
    );
    res.status(200).json({ data: result.rows[0], message: "Unliked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get follow state
reviews.get("/api/video-review/follow-state/:userId/:followId", async (req, res) => {
  const client = req.dbClient;
  const { followId, userId } = req.params;
  try {
    const result = await client.query("SELECT * FROM follows WHERE user_id = $1 AND follow_id = $2", [userId, followId]);
    if (result.rows.length > 0) {
      res.status(200).json({ followed: true });
    } else {
      res.status(200).json({ followed: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})
// follow action
reviews.post("/api/video-review/follow", async (req, res) => {
  const { userId, followId } = req.body;
  const client = req.dbClient;
  try {
    const result = await client.query(
      'INSERT INTO follows (user_id, follow_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [userId, followId])
    if (result.rows.length === 0) {
      res.status(200).json({ data: result.rows[0], message: "Already followed" });
    } else {
      res.status(200).json({ data: result.rows[0], message: "Followed" });
    }
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
})


// unfollow action
reviews.post("/api/video-review/unfollow", async (req, res) => {
  const { userId, followId } = req.body;
  const client = req.dbClient;
  try {
    const result = await client.query(
      'DELETE FROM follows WHERE user_id = $1 AND follow_id = $2 RETURNING *',
      [userId, followId])
    res.status(200).json({ data: result.rows[0], message: "Unfollowed" });
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
})
export default reviews;