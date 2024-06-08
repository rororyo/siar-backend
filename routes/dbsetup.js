import pg from "pg";
import env from "dotenv";
env.config();

const { Pool } = pg;
let pool; 

if (process.env.NODE_ENV == "local") {
    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DB,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        // connectionString: process.env.POSTGRES_URL,
    });
}
else if (process.env.NODE_ENV == "production") {
    pool = new Pool({
        connectionString: process.env.POSTGRES_URL
    });
}

export const dbMiddleware = async (req, res, next) => {
    const client = await pool.connect();

    try {
        req.dbClient = client;
        next();
    } catch (error) {
        console.error('Error in middleware:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        if (client) {
            client.release();
        }
    }
};