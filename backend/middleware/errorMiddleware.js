const errorHandler = (err, req, res, next) => {
    try {
        // Set status code
        const statusCode = res.statusCode ? res.statusCode : 500;

        // Ensure we're sending a proper status code
        res.status(statusCode);

        // Send JSON response with error details
        res.json({
            success: false,
            message: err.message || "An error occurred",
            stack: process.env.NODE_ENV === 'development' ? err.stack : null
        });
    } catch (error) {
        // Fallback in case of any issues with the error handler itself
        console.error("Error in error handler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = errorHandler;
