const { validationResult } = require('express-validator');

exports.validationErrorHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    next(); // Proceed to the next middleware or route handler if no errors
};
