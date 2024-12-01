// errorHandler.js
const errorHandler = (err, req, res, next) => {
    // Log the error for debugging purposes
    console.error(err.stack);

    // Check if the error is an instance of a custom error (optional)
    if (err.isCustom) {
        return res.status(err.status || 500).json({
            message: err.message || 'Something went wrong.',
        });
    }

    // Default error handler (for any unhandled errors)
    res.status(500).json({
        message: err.message || 'Internal Server Error',
    });
};

module.exports = errorHandler;
