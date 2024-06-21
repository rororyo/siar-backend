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
//sort umkms by category
homepage.get("/api/kategori/:id", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT menus.*,umkms.*,kategori FROM menus JOIN kategori ON kategori_id = kategori.id join umkms on restaurant_id = umkms.id where menus.kategori_id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      res.status(200).json({ umkms: result.rows });
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