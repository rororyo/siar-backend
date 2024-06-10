import express from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { dbMiddleware } from "./dbsetup.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from "dotenv";

const authApp = express();
// List of allowed origins
const allowedOrigins = [
    "http://localhost:3000",
    "https://4x9br3l0-3000.asse.devtunnels.ms",
    "https://halal-hunter.vercel.app/",
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
env.config();
authApp.use(cors(corsOptions));
authApp.use(express.json());
authApp.use(express.urlencoded({ extended: true }));
authApp.use(cookieParser());
authApp.use(dbMiddleware); 

// Check for cookies
export const isLoggedin = (req) => {
    const token = req.cookies.token;
    return !!token;
};

authApp.post("/register", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const client = req.dbClient;
    try {
        const checkResult = await client.query("SELECT * FROM users WHERE email = $1", [email]);

        if (checkResult.rows.length > 0) {
            res.status(400).send({ message: 'Email already exists' });
        } else {
            const hash = await argon2.hash(password);
            const result = await client.query("INSERT INTO users(email, password, username) VALUES($1,$2,$3) RETURNING *", [email, hash, req.body.username]);
            if (result.rows.length > 0) {
                res.status(200).send({message: 'User created successfully'});
            }
        }
    } catch (err) {
        console.error('Error in registration:', err);
        res.status(500).send({message : err.message});
    }
});

authApp.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const client = req.dbClient;

    try {
        const result = await client.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashPassword = user.password;
            const valid = await argon2.verify(storedHashPassword, password);

            if (valid) {
                const token = generateToken(user);
                res.cookie("token", token);
                res.status(200).send({ user, token });
            } else {
                res.status(401).json({ message: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        console.error('Error in login:', err);
        res.status(500).json(err.message);
    }
});

authApp.get("/logout", (req, res) => {
    if (isLoggedin(req)) {
        res.clearCookie("token");
        res.send("Logout successful");
    } else {
        res.status(401).send("Not logged in");
    }
});

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign({ user }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

export default authApp;
