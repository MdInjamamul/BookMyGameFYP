const paginationLimiter = (req, res, next) => {
    // Implement MAX_LIMIT caps unconditionally to sanitize requests

    // If no limit is explicitly set, controllers usually default. 
    // This strictly captures user-provided query params.
    if (req.query.limit) {
        let parsedLimit = parseInt(req.query.limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            parsedLimit = 10;
        } else if (parsedLimit > 100) {
            // Global MAX_LIMIT cap
            parsedLimit = 100;
        }
        
        // Rewrite value so downstream controllers hit the capped value
        req.query.limit = parsedLimit.toString();
    }
    
    // Protect massive OFFSET calculations
    if (req.query.page) {
        let parsedPage = parseInt(req.query.page);
        if (isNaN(parsedPage) || parsedPage <= 0) {
            parsedPage = 1;
        } else if (parsedPage > 2000) { 
            // Arbitrary sane bound to stop DoS via unbounded OFFSET 
            parsedPage = 2000; 
        }
        req.query.page = parsedPage.toString();
    }

    next();
};

module.exports = paginationLimiter;
