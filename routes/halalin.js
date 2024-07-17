import express from "express";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from "dotenv";

const halalin = express();
halalin.set('trust proxy', true);

// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://4x9br3l0-3000.asse.devtunnels.ms",
  "https://halal-hunter.vercel.app",
  "https://4mwqv6dl-3000.asse.devtunnels.ms",
];

// Dynamic CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
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

//get all requests
halalin.get("/api/halalin", async (req, res) => {
  const client = req.dbClient;
  try {
    const result = await client.query("SELECT * FROM umkms_requests");
    if (result.rows.length > 0) {
      return res.status(200).json({ message: 'Data fetched successfully', data: result.rows });
    } else {
      return res.status(400).json({ message: 'Data not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

//post a request
halalin.post("/api/halalin", async (req, res) => {
  const client = req.dbClient;
  const { nama, lat, long, nomor_telp,user_id } = req.body;

  try {
    // Insert the new UMKM record to requests table
    const result = await client.query(
      "INSERT INTO umkms_requests (user_id,nama, lat, long, nomor_telp) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id,nama, parseFloat(lat), parseFloat(long), nomor_telp]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({ message: 'Data inserted successfully', data: result.rows[0] });
    } else {
      return res.status(400).json({ message: 'Data not inserted' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

//admin endpoints
//accept a request
halalin.post("/api/halalin/accept", async (req, res) => {
  const client = req.dbClient;
  const { reqId, user_id, nama, lat, long, nomor_telp } = req.body;
  try {
    // Insert into umkms
    const result = await client.query(
      "INSERT INTO umkms (nama, lat, long, nomor_telp) VALUES ($1, $2, $3, $4) RETURNING *",
      [nama, parseFloat(lat), parseFloat(long), nomor_telp]
    );

    if (result.rows.length > 0) {
      // Give rewards
      await client.query("UPDATE users SET exp = exp + 5 WHERE id = $1", [user_id]);

      // Delete from umkms_requests
      const result2 = await client.query("DELETE FROM umkms_requests WHERE id = $1 RETURNING *", [reqId]);
      if (result2.rows.length > 0) {
        res.status(200).json({ message: 'Data inserted successfully', data: result.rows[0] });
      } else {
        res.status(400).json({ message: 'Data failed to delete from requests table' });
      }
    } else {
      res.status(400).json({ message: 'Data not inserted' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//reject a request
halalin.delete("/api/halalin/reject/:reqId", async (req, res) => {
  const client = req.dbClient;
  const reqId = req.params.reqId;
  try{
    const result = await client.query("DELETE FROM umkms_requests WHERE id = $1", [reqId]);
    if(result.rows.length > 0){
      res.status(200).json({ message: 'Data deleted successfully' });
    }
    else{
      res.status(400).json({ message: 'Data not deleted' });
    }
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
})
export default halalin;
