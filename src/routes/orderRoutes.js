const express = require('express');
const { body, param } = require('express-validator');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const { 
    placeOrder, 
    getOrderHistory, 
    getSingleOrder, 
    cancelOrder, 
    approveOrder 
} = require('../controllers/orderController');
const { validationErrorHandler } = require('../middleware/validationErrorHandler');

const router = express.Router();

// Place an order
router.post(
    '/',
    authenticateToken,
    [
        body('items')
            .isArray({ min: 1 })
            .withMessage('Items array is required and must contain at least one item.'),
        body('items.*.product_id')
            .isInt({ min: 1 })
            .withMessage('Each item must have a valid product_id (positive integer).'),
        body('items.*.quantity')
            .isInt({ min: 1 })
            .withMessage('Each item must have a valid quantity (positive integer).')
    ],
    validationErrorHandler,
    placeOrder
);

// View order history (authenticated user only)
router.get('/', authenticateToken, getOrderHistory);

// View a single order (authenticated user only)
router.get(
    '/:id',
    authenticateToken,
    [
        param('id').isInt({ min: 1 }).withMessage('Order ID must be a valid integer')
    ],
    validationErrorHandler,
    getSingleOrder
);

// Cancel an order (User who ordered or Admin can cancel)
router.delete(
    '/:id',
    authenticateToken,  // Authenticate the user
    cancelOrder          // Use the controller function directly
);

// Approve an order (Admin only)
router.patch(
    '/:id/approve',
    authenticateToken,  // Authenticate the admin user
    authenticateAdmin,   // Ensure the user is an admin
    approveOrder         // Use the controller function directly
);

module.exports = router;
