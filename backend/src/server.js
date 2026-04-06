const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const paginationLimiter = require('./middleware/paginationLimiter');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Disable CORP to allow frontend on port 5173 to load local static images from port 5000
}));

// CORS configuration (MUST come before rate limiting so 429 responses include CORS headers)
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
}));

// Rate limiting (after CORS so blocked responses still have proper headers)
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (accessible via both /uploads and /api/uploads for frontend compatibility)
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'BookMyGame API is running',
        timestamp: new Date().toISOString(),
    });
});

// App-wide data scrubbers
app.use(paginationLimiter);

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/venues', require('./routes/venue.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/timeslots', require('./routes/timeslot.routes'));
app.use('/api/sports', require('./routes/sport.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/training', require('./routes/training.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/contact', require('./routes/contact.routes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global error handler (centralized)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Set up HTTP and WebSockets
const http = require('http');
const socketModule = require('./socket');
const server = http.createServer(app);

// Initialize Socket.io
socketModule.init(server);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);

    // Start background cron: auto-expire pending bookings/registrations after 5 min
    const { startPendingPaymentCleaner } = require('./services/pendingPaymentCleaner');
    startPendingPaymentCleaner();

    // Start background cron: check for completed bookings and ask for reviews
    const { startCompletedBookingChecker } = require('./services/completedBookingChecker');
    startCompletedBookingChecker();
});

module.exports = app;
