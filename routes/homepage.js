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
    const result = await client.query("SELECT umkms.*,kategori FROM umkms JOIN kategori ON kategori_id = kategori.id where umkms.kategori_id = $1", [req.params.id]);
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

homepage.post('/api/nearbyPlaces', async (req, res) => {
  const { latitude, longitude } = req.body;
  const client = req.dbClient;
  const query = `
    SELECT *,
      earth_distance(
        ll_to_earth(lat, long),
        ll_to_earth($1, $2)
      ) as distance
    FROM umkms
    WHERE earth_box(ll_to_earth($1, $2), 2000) @> ll_to_earth(lat, long)
    AND earth_distance(
        ll_to_earth(lat, long),
        ll_to_earth($1, $2)
      ) < 20000
    ORDER BY rating DESC
    LIMIT 5;
  `;

  try {
    const result = await client.query(query, [latitude, longitude]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error fetching nearby places');
  }
});

export default homepage