const express = require('express');
const { 
    registerUser, 
    loginUser, 
    getUserDetails, 
    updateUserProfile 
} = require('../controllers/userController');
const authenticateToken = require('../middleware/authenticateToken');
const { body, param } = require('express-validator');
const { validationErrorHandler } = require('../middleware/validationErrorHandler'); // Custom middleware for validation errors

const router = express.Router();

// Register a new user
router.post(
    '/register',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password should be at least 6 characters long')
    ],
    validationErrorHandler, // Handle validation errors
    registerUser
);

// Login route
router.post(
    '/login',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validationErrorHandler, // Handle validation errors
    loginUser
);

// Get user details (authenticated user only)
router.get(
    '/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('User ID must be a valid integer')
    ],
    validationErrorHandler, // Handle validation errors
    getUserDetails
);

// Update user profile (authenticated user only)
router.put(
    '/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('User ID must be a valid integer'),
        body('username').optional().notEmpty().withMessage('Username cannot be empty'),
        body('email').optional().isEmail().withMessage('Please provide a valid email'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password should be at least 6 characters long')
    ],
    validationErrorHandler, // Handle validation errors
    updateUserProfile
);

module.exports = router;
