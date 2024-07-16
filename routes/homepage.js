import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from "dotenv";

const homepage = express();
homepage.set('trust proxy', true)
// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://4x9br3l0-3000.asse.devtunnels.ms",
  "https://halal-hunter.vercel.app",
  "https://4mwqv6dl-3000.asse.devtunnels.ms",
  "https://g562f42v-3000.asse.devtunnels.ms"
];

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
homepage.use(cors(corsOptions));
homepage.use(express.json());
homepage.use(express.urlencoded({ extended: true }));
homepage.use(cookieParser());
homepage.use(dbMiddleware);
//get all categories
homepage.get("/api/kategori", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT * FROM kategori");
    if (result.rows.length > 0) {
      res.status(200).json({ categories: result.rows });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
}});
//get umkms by category
homepage.get("/api/kategori/:id", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT * FROM umkms WHERE kategori_id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      res.status(200).json({ umkms: result.rows });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//sort menus by category
homepage.get("/api/menus/:id", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT menus.* FROM menus where restaurant_id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      res.status(200).json({ menus: result.rows });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get popular umkms
homepage.get("/api/kategori/popular/:id", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT menus.*,umkms.*,kategori FROM menus JOIN kategori ON kategori_id = kategori.id join umkms on restaurant_id = umkms.id where menus.kategori_id = $1 ORDER BY umkms.rating DESC LIMIT 10", [req.params.id]);
    if (result.rows.length > 0) {
      res.status(200).json({ umkms: result.rows });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})
//get open places
homepage.get("/api/kategori/open/:id", async (req, res) => {
  const client = req.dbClient;
  const currentTime = new Date();  // Current time object

  // Format current time as 'HH:MM:SS' to compare with database time values
  const formattedCurrentTime = currentTime.toTimeString().split(' ')[0];

  try {
    // Query to check if current time is within open_at and close_at times
    const query = "SELECT *, (open_at <= $2 AND close_at >= $2) AS is_open FROM umkms WHERE kategori_id = $1";
    const result = await client.query(query, [req.params.id, formattedCurrentTime]);

    if (result.rows.length > 0) {
      // Add additional information to the response about the open status
      const place = result.rows;
      res.status(200).json({ 
        umkm: place,
        isOpen: place.is_open,  // This tells if the place is currently open
        currentTime: formattedCurrentTime  // Optional, for debugging or display purposes
      });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//get specific umkms by id
homepage.get("/api/umkm/:id", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT * FROM umkms WHERE id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      res.status(200).json({ umkm: result.rows[0] });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get all articles
homepage.get("/api/articles", async (req, res) => {
  const client =req.dbClient;
  try{
    const result = await client.query("SELECT * FROM articles limit 4");
    if(result.rows.length > 0){
      res.status(200).json({ articles: result.rows });
    }
    else{
      res.status(404).json({ message: "Data not found" });
    }
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
})
//get specific article by id 
homepage.get("/api/article/:id", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT * FROM articles WHERE id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      res.status(200).json({ article: result.rows[0] });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

homepage.post('/api/nearby-places', async (req, res) => {
  const { latitude, longitude } = req.body;

  // Convert latitude and longitude to numbers
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ message: "Invalid latitude or longitude values." });
  }

  const client = req.dbClient;
  const fetchQuery = `
    SELECT *
    FROM umkms;
  `;

  try {
    const result = await client.query(fetchQuery);
    const places = result.rows.map(place => ({
      ...place,
      distance: haversineDistance(lat, lon, place.lat, place.long)
    }))
    .filter(place => place.distance < 2) // Filter places within 2 km radius
    .sort((a, b) => a.distance - b.distance) // Sort by distance
    .slice(0, 5); // Limit to the top 5 closest places

    res.status(200).json({ places });
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ message: err.message });
  }
});

// get reviews for specific umkm
homepage.get("/api/reviews/:umkmId", async (req, res) => {
  const client = req.dbClient;
  const umkmId = req.params.umkmId;
  const rating = req.query.rating;

  try {
    let result;
    if (rating) {
      const minRating = parseInt(rating, 10);
      const maxRating = minRating + 0.99;
      result = await client.query(
        "SELECT * FROM text_reviews JOIN users ON user_id = users.id WHERE umkms_id = $1 AND rating >= $2 AND rating <= $3",
        [umkmId, minRating, maxRating]
      );
    } else {
      result = await client.query(
        "SELECT * FROM text_reviews JOIN users ON user_id = users.id WHERE umkms_id = $1",
        [umkmId]
      );
    }

    
      res.status(200).json({ reviews: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//post a review 
homepage.post("/api/reviews", async (req, res) => {
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


function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => x * Math.PI / 180;

  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}


export default homepage