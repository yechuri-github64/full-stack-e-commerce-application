const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'admin',
    password: process.env.DATABASE_PASSWORD || 'password123',
    database: process.env.DATABASE_NAME || 'ecommerce_dev' ,
    max: 20, // Optional: Max number of connections
    idleTimeoutMillis: 30000, // Optional: Close idle connections after 30s
    connectionTimeoutMillis: 2000 // Optional: Timeout after 2s if cannot connect
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
};

module.exports = {
    connectDB,
    pool,
    query: (text, params) => pool.query(text, params),
};
