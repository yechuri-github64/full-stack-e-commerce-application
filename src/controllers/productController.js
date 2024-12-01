const { query } = require('../config/db');
const { validationResult } = require('express-validator');

// Status Codes
const STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

// List all products with optional pagination and filtering
exports.getAllProducts = async (req, res) => {
    const { limit = 10, offset = 0, sort = 'created_at', minPrice, maxPrice } = req.query;

    try {
        // Build query based on filters
        let queryStr = 'SELECT * FROM products WHERE 1 = 1';  // Start with base query

        // Add price filtering if provided
        if (minPrice) {
            queryStr += ` AND price >= ${minPrice}`;
        }
        if (maxPrice) {
            queryStr += ` AND price <= ${maxPrice}`;
        }

        // Sort products based on provided sort field
        queryStr += ` ORDER BY ${sort} DESC`; // Default sort is descending order

        // Apply limit and offset for pagination
        queryStr += ` LIMIT $1 OFFSET $2`;

        const result = await query(queryStr, [limit, offset]);

        res.status(STATUS.OK).json({ products: result.rows, pagination: { page: Math.floor(offset / limit) + 1, limit } });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching products' });
    }
};

// View a single product
exports.getProductById = async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid product ID.' });
    }

    try {
        const result = await query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(STATUS.NOT_FOUND).json({ message: 'Product not found.' });
        }

        res.status(STATUS.OK).json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching product' });
    }
};

// Add a new product (Admin only)
exports.createProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { name, description, price, stock } = req.body;

    if (price <= 0 || stock < 0) {
        return res.status(STATUS.BAD_REQUEST).json({ message: 'Price must be positive and stock non-negative.' });
    }

    try {
        // Check for duplicate product name
        const existingProduct = await query('SELECT * FROM products WHERE name = $1', [name]);
        if (existingProduct.rows.length > 0) {
            return res.status(STATUS.BAD_REQUEST).json({ message: 'Product with this name already exists.' });
        }

        const result = await query(
            'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, price, stock]
        );

        res.status(STATUS.CREATED).json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Error adding product' });
    }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
    }

    if (isNaN(id) || price <= 0 || stock < 0) {
        return res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid input values.' });
    }

    try {
        // Check if the product exists
        const existingProduct = await query('SELECT * FROM products WHERE id = $1', [id]);
        if (existingProduct.rows.length === 0) {
            return res.status(STATUS.NOT_FOUND).json({ message: 'Product not found.' });
        }

        const result = await query(
            'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, description, price, stock, id]
        );

        res.status(STATUS.OK).json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error updating product:', error.message);
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Error updating product' });
    }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(STATUS.BAD_REQUEST).json({ message: 'Invalid product ID.' });
    }

    try {
        const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(STATUS.NOT_FOUND).json({ message: 'Product not found.' });
        }

        res.status(STATUS.OK).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Error deleting product' });
    }
};
