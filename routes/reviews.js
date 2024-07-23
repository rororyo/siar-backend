import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import  upload  from "./multer-config.js";
import s3Client from "./aws-config.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
dotenv.config();

const reviews = express();
reviews.set('trust proxy', true);

const allowedOrigins = [
  'http://localhost:3000',
  'https://4x9br3l0-3000.asse.devtunnels.ms',
  'https://halal-hunter.vercel.app',
  'https://4mwqv6dl-3000.asse.devtunnels.ms',
  'https://g562f42v-3000.asse.devtunnels.ms',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

reviews.use(cors(corsOptions));
reviews.use(express.json());
reviews.use(express.urlencoded({ extended: true }));
reviews.use(cookieParser());
reviews.use(dbMiddleware);

// get reviews by umkm name
reviews.get('/api/text-reviews', async (req, res) => {
  const client = req.dbClient;
  const umkmName = req.query['wayspot'];
  try {
    const result = await client.query(
      'SELECT t.id, t.umkms_id, t.user_review FROM text_reviews t JOIN umkms u ON u.id = t.umkms_id WHERE nama = $1 ORDER BY t.id DESC LIMIT 5',
      [umkmName]
    );
      res.status(200).json({ reviews: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get all video reviews
reviews.get('/api/video-reviews', async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query(
      'SELECT video_reviews.*, users.email, users.username FROM video_reviews JOIN users ON user_id = users.id'
    );
    if (result.rows.length > 0) {
      res.status(200).json({ reviews: result.rows });
    } else {
      res.status(404).json({ message: 'Data not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//get nearby video reviews
reviews.post('/api/video-reviews/nearby', async (req, res) => {
  const client = req.dbClient;
  const { latitude, longitude } = req.body;
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ message: "Invalid latitude or longitude values." });
  }

  try {
    const result = await client.query(
      `SELECT video_reviews.*, users.email, users.username,
      ( 6371 * acos( cos( radians($1) ) * cos( radians( lat ) ) * cos( radians( long ) - radians($2) ) + sin( radians($1) ) * sin( radians( lat ) ) ) ) AS distance
      FROM video_reviews
      JOIN users ON video_reviews.user_id = users.id
      join umkms on video_reviews.umkms_id = umkms.id
      ORDER BY distance`,
      [lat, lon]
    );

      res.status(200).json({ reviews: result.rows });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get following video reviews
reviews.get('/api/video-reviews/following/:userId', async (req, res) => {
  const client = req.dbClient;
  const userId = req.params.userId;
  try {
    const result = await client.query(
      'SELECT video_reviews.*, users.email, users.username FROM video_reviews JOIN follows ON video_reviews.user_id = follows.follow_id join users on video_reviews.user_id = users.id WHERE follows.user_id = $1',
      [userId]
    );
  
      res.status(200).json({ reviews: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})
//post a review 
reviews.post("/api/text-reviews", async (req, res) => {
  const client = req.dbClient;
  const { umkms_id, rating, review, user_id } = req.body;
  let message = '';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    //check if the user has submitted a review today
    const userResult = await client.query(
      'SELECT last_review_date FROM users WHERE id = $1',
      [user_id]
    );
    if (new Date(userResult.rows[0].last_review_date) < today) {
      await client.query(
        'UPDATE users SET last_review_date = $1 WHERE id = $2',
        [today, user_id]
      );
      await client.query(
        'update users set exp = exp + 5 where id = $1',[user_id])
        message = 'First Review of The Day! +5 Exp';
    }
    else{
      message = 'Review sucessfully submitted';
    }
    const result = await client.query(
      "INSERT INTO text_reviews (umkms_id, rating, user_review, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [umkms_id, rating, review, user_id]
    );
    res.status(201).json({ review: result.rows[0] ,message});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload a video review
reviews.post('/api/video-review', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  try {
    const client = req.dbClient;
    const videoFile = req.files.video ? req.files.video[0] : null;
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const { title, description, umkms_id, user_id } = req.body;

    if (!videoFile || !thumbnailFile) {
      return res.status(400).json({ message: 'Video and thumbnail files are required' });
    }

    // Upload video to S3
    const videoParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `videos/${Date.now()}_${videoFile.originalname}`,
      Body: videoFile.buffer,
      ContentType: videoFile.mimetype,
    };
    const videoData = await s3Client.send(new PutObjectCommand(videoParams));

    // Upload thumbnail to S3
    const thumbnailParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `thumbnails/${Date.now()}_${thumbnailFile.originalname}`,
      Body: thumbnailFile.buffer,
      ContentType: thumbnailFile.mimetype,
    };
    const thumbnailData = await s3Client.send(new PutObjectCommand(thumbnailParams));

    const response = await client.query(
      'INSERT INTO video_reviews (title, description, file_path, thumbnail_path, umkms_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, `${videoParams.Key}`, `${thumbnailParams.Key}`, umkms_id, user_id]
    );
    res.status(200).json({ data: response.rows[0], message: 'Success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// get video reviews by id
reviews.get('/api/video-reviews/:videoId', async (req, res) => {
  const client = req.dbClient;
  const videoId = req.params.videoId;
  try {
    const result = await client.query(
      'SELECT video_reviews.*, users.id, users.email, users.username, users.rank, umkms.id, umkms.nama FROM video_reviews JOIN users ON user_id = users.id JOIN umkms ON umkms_id = umkms.id WHERE video_reviews.id = $1',
      [videoId]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ reviews: result.rows });
    } else {
      res.status(404).json({ message: 'Data not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get video likes
reviews.get('/api/video-review/likes/:reviewId', async (req, res) => {
  const client = req.dbClient;
  const reviewId = req.params.reviewId;
  try {
    const result = await client.query('SELECT count(*) AS like_count FROM likes WHERE video_id = $1', [reviewId]);
    res.status(200).json({ likes: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get like state
reviews.get('/api/video-review/like-state/:reviewId/:userId', async (req, res) => {
  const client = req.dbClient;
  const { reviewId, userId } = req.params;
  try {
    const result = await client.query('SELECT * FROM likes WHERE video_id = $1 AND user_id = $2', [reviewId, userId]);
    if (result.rows.length > 0) {
      res.status(200).json({ liked: true });
    } else {
      res.status(200).json({ liked: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// like video review
reviews.post('/api/video-review/like', async (req, res) => {
  const { userId, postId } = req.body;
  const client = req.dbClient;
  try {
    const result = await client.query('INSERT INTO likes (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *', [userId, postId]);
    if (result.rows.length === 0) {
      const existingLike = await client.query('SELECT * FROM likes WHERE user_id = $1 AND video_id = $2', [userId, postId]);
      res.status(200).json({ data: existingLike.rows[0], message: 'Already liked' });
    } else {
      res.status(200).json({ data: result.rows[0], message: 'Liked' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// unlike video review
reviews.post('/api/video-review/unlike', async (req, res) => {
  const { userId, postId } = req.body;
  const client = req.dbClient;
  try {
    const result = await client.query('DELETE FROM likes WHERE user_id = $1 AND video_id = $2 RETURNING *', [userId, postId]);
    res.status(200).json({ data: result.rows[0], message: 'Unliked' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// get follow state
reviews.get('/api/video-review/follow-state/:userId/:followId', async (req, res) => {
  const client = req.dbClient;
  const { followId, userId } = req.params;
  try {
    const result = await client.query('SELECT * FROM follows WHERE user_id = $1 AND follow_id = $2', [userId, followId]);
    if (result.rows.length > 0) {
      res.status(200).json({ followed: true });
    } else {
      res.status(200).json({ followed: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// follow action
reviews.post('/api/video-review/follow', async (req, res) => {
  const { userId, followId } = req.body;
  const client = req.dbClient;
  try {
    const result = await client.query('INSERT INTO follows (user_id, follow_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *', [userId, followId]);
    if (result.rows.length === 0) {
      res.status(200).json({ data: result.rows[0], message: 'Already followed' });
    } else {
      res.status(200).json({ data: result.rows[0], message: 'Followed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// unfollow action
reviews.post('/api/video-review/unfollow', async (req, res) => {
  const { userId, followId } = req.body;
  const client = req.dbClient;
  try {
    const result = await client.query('DELETE FROM follows WHERE user_id = $1 AND follow_id = $2 RETURNING *', [userId, followId]);
    res.status(200).json({ data: result.rows[0], message: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default reviews;
