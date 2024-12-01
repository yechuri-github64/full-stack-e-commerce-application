const express = require('express');
const { body, param, query } = require('express-validator');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const { 
    getAllProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/productController');
const { validationErrorHandler } = require('../middleware/validationErrorHandler'); // Custom validation middleware

const router = express.Router();

// List all products with optional pagination and filtering
router.get(
    '/',
    [
        query('limit')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Limit must be a positive integer')
            .toInt(), // Convert to integer
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be a non-negative integer')
            .toInt(), // Convert to integer
        query('sort')
            .optional()
            .isIn(['name', 'price', 'created_at'])
            .withMessage('Sort must be a valid field'),
        query('minPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('minPrice must be a positive number'),
        query('maxPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('maxPrice must be a positive number')
    ],
    validationErrorHandler, // Handle validation errors
    getAllProducts
);

// View a single product
router.get(
    '/:id',
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Product ID must be a valid integer')
    ],
    validationErrorHandler, // Handle validation errors
    getProductById
);

// Add a new product (Admin only)
router.post(
    '/',
    authenticateToken,
    authenticateAdmin,
    [
        body('name').notEmpty().withMessage('Product name is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('description').optional().isString().withMessage('Description should be a valid string')
    ],
    validationErrorHandler, // Handle validation errors
    createProduct
);

// Update product (Admin only)
router.put(
    '/:id',
    authenticateToken,
    authenticateAdmin,
    [
        param('id').isInt({ min: 1 }).withMessage('Product ID must be a valid integer'),
        body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('description').optional().isString().withMessage('Description should be a valid string')
    ],
    validationErrorHandler, // Handle validation errors
    updateProduct
);

// Delete product (Admin only)
router.delete(
    '/:id',
    authenticateToken,
    authenticateAdmin,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Product ID must be a valid integer')
    ],
    validationErrorHandler, // Handle validation errors
    deleteProduct
);

module.exports = router;
