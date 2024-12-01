const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

(async () => {
    try {
        const res = await pool.query('SELECT NOW() AS current_time');
        console.log('Database connected:', res.rows[0]);
    } catch (err) {
        console.error('Database connection error:', err.message);
    } finally {
        await pool.end();
    }
})();
