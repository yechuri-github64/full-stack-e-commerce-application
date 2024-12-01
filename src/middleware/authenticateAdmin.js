const jwt = require('jsonwebtoken');
const { query } = require('../config/db'); // Import database connection

// Middleware for Admin Authorization
const authenticateAdmin = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    const jwtSecret = process.env.JWT_SECRET;

    try {
        // Decode and verify the JWT token
        const decoded = jwt.verify(token, jwtSecret);

        // Check if the decoded token contains 'is_admin' as true
        if (!decoded.is_admin) {
            return res.status(403).json({ message: 'Admins only.' });
        }

        // Optionally, you can also check if the admin exists in the database
        const result = await query('SELECT id FROM users WHERE id = $1 AND is_admin = true', [decoded.userId]);
        if (!result.rows || result.rows.length === 0) {
            return res.status(403).json({ message: 'Admin rights are missing or invalid.' });
        }

        req.user = decoded; // Attach decoded token to req.user
        next();
    } catch (err) {
        console.error('Admin authentication error:', err.message);
        res.status(403).json({ message: 'Token is invalid or admin rights missing.' });
    }
};

module.exports = authenticateAdmin;
