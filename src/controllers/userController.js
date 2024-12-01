const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const dotenv = require('dotenv');
const { validationResult } = require('express-validator');

dotenv.config();

// Register a new user
exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, is_admin = false } = req.body;

    try {
        // Check if email already exists
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const result = await query(
            'INSERT INTO users (username, email, password, is_admin, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, is_admin, created_at',
            [username, email, hashedPassword, is_admin]
        );

        // Respond with the created user
        res.status(201).json({
            message: 'Registration successful.',
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Error during registration:', error.stack);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
        });
    } catch (error) {
        console.error('Error logging in:', error.stack);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Get user details
exports.getUserDetails = async (req, res) => {
    const { id } = req.params;

    // Ensure the user can only view their own profile
    if (req.user.userId !== parseInt(id)) {
        return res.status(403).json({ message: 'You are not authorized to view this profile.' });
    }

    try {
        const result = await query('SELECT id, username, email, address, created_at, updated_at FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error fetching user details:', error.stack);
        res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    // Ensure the user can only update their own profile
    if (req.user.userId !== parseInt(id)) {
        return res.status(403).json({ message: 'You do not have permission to update this profile.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const queryText = `
            UPDATE users
            SET username = COALESCE($1, username),
                email = COALESCE($2, email),
                password = COALESCE($3, password),
                updated_at = NOW()
            WHERE id = $4
            RETURNING id, username, email, updated_at;
        `;
        const values = [username || null, email || null, hashedPassword, id];

        const updatedUser = await query(queryText, values);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser.rows[0] });
    } catch (error) {
        console.error('Error updating user profile:', error.stack);
        res.status(500).json({ message: 'Error updating user profile', error: error.message });
    }
};
