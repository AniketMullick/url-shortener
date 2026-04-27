import {Pool} from 'pg'
import dotenv from 'dotenv'
dotenv.config();
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});
export default pool;