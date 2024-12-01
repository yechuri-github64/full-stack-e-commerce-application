const jwt = require('jsonwebtoken');
const { query } = require('../config/db'); // Import database connection

const authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    const jwtSecret = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, jwtSecret); // Verify and decode the JWT token

        // Query the database to check if the user exists
        const result = await query('SELECT id FROM users WHERE id = $1', [decoded.userId]);

        if (!result.rows || result.rows.length === 0) {
            return res.status(403).json({ message: 'User not found or account inactive.' });
        }

        req.user = decoded; // Store decoded token information in req.user

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired.' });
        }
        console.error('Token authentication error:', err.message);
        return res.status(403).json({ message: 'Token is invalid.' });
    }
};

module.exports = authenticateToken;
