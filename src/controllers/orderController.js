const { pool } = require('../config/db');  // Importing pool correctly
const { validationResult } = require('express-validator');

/**
 * Utility function for handling validation errors
 */
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return null;  // Return null if no validation errors
};

/**
 * Utility function to fetch product details and calculate total price
 */
const fetchProductsAndCalculateTotal = async (client, items) => {
    let totalAmount = 0;
    const productDetails = [];

    for (const item of items) {
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        if (productResult.rows.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found.`);
        }

        const product = productResult.rows[0];
        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        totalAmount += product.price * item.quantity;
        productDetails.push({ ...product, quantity: item.quantity });
    }

    return { totalAmount, productDetails };
};

/**
 * Place an order
 */
exports.placeOrder = async (req, res) => {
    const { userId } = req.user; // Extract userId from token
    const { items } = req.body;

    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Calculate total and fetch product details (handles stock check and product existence)
        const { totalAmount, productDetails } = await fetchProductsAndCalculateTotal(client, items);

        // Insert the order into the database
        const orderResult = await client.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
            [userId, totalAmount, 'pending']
        );
        const order_id = orderResult.rows[0].id;

        // Insert order items and update stock
        for (const product of productDetails) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [order_id, product.id, product.quantity, product.price]
            );

            const newStock = product.stock - product.quantity;
            await client.query(
                'UPDATE products SET stock = $1 WHERE id = $2',
                [newStock, product.id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Order placed successfully', order_id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: error.message || 'Error placing order' });
    } finally {
        client.release();
    }
};

/**
 * Get order history (for user or admin)
 */
exports.getOrderHistory = async (req, res) => {
    const { userId, is_admin } = req.user;
    const { limit = 10, offset = 0 } = req.query;

    try {
        const queryText = is_admin
            ? 'SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2'
            : 'SELECT * FROM orders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3';
        const queryParams = is_admin ? [limit, offset] : [userId, limit, offset];
        const result = await pool.query(queryText, queryParams);

        res.status(200).json({ orders: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

/**
 * Get single order details
 */
exports.getSingleOrder = async (req, res) => {
    const { id } = req.params;
    const { userId, is_admin } = req.user;

    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    try {
        const orderResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const order = orderResult.rows[0];

        // Check authorization
        if (!is_admin && order.user_id !== userId) {
            return res.status(403).json({ message: 'You are not authorized to view this order.' });
        }

        const orderItemsResult = await pool.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [id]
        );
        res.status(200).json({ order, items: orderItemsResult.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
};

/**
 * Cancel an order
 */
exports.cancelOrder = async (req, res) => {
    const { id } = req.params;
    const { userId, is_admin } = req.user;

    try {
        // Correct use of pool.query
        const orderResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const order = orderResult.rows[0];

        // Admin can cancel any order, else check if the order belongs to the logged-in user
        if (!is_admin && order.user_id !== userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this order.' });
        }

        // Ensure the order is in a 'pending' status before canceling
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'You cannot cancel this order as it is already processed.' });
        }

        // Mark order as canceled
        await pool.query('UPDATE orders SET status = $1, deleted_at = NOW() WHERE id = $2', ['canceled', id]);

        res.status(200).json({ message: 'Order canceled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error canceling order' });
    }
};


/**
 * Approve an order
 */
exports.approveOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const orderResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const order = orderResult.rows[0];

        // Only approve pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order cannot be approved as it is not pending.' });
        }

        // Update order status to approved
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['approved', id]);

        res.status(200).json({ message: 'Order approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving order' });
    }
};
