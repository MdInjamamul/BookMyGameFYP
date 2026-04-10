const venueService = require('../services/venue.service');

/**
 * Venue Controller
 * Handles all venue-related operations for both public and operator access
 * Delegates business logic to venue.service.js
 */

// ============================================
// PUBLIC ENDPOINTS
// ============================================

const getVenues = async (req, res) => {
    try {
        const result = await venueService.getVenues(req.query);
        res.json({
            success: true,
            data: result.venues,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: result.pages,
            },
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venues',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

const getVenueById = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const venue = await venueService.getVenueById(req.params.id, userId);
        res.json({
            success: true,
            data: venue,
        });
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(error.message === 'Venue not found' ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to fetch venue',
        });
    }
};

const getPublicStats = async (req, res) => {
    try {
        const data = await venueService.getPublicStats();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch platform stats' });
    }
};

const getCities = async (req, res) => {
    try {
        const cities = await venueService.getCities();
        res.json({ success: true, data: cities });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
};

// ============================================
// OPERATOR ENDPOINTS
// ============================================

const getOperatorVenues = async (req, res) => {
    try {
        const result = await venueService.getOperatorVenues(req.user.id, req.query);
        res.json({
            success: true,
            data: result.venues,
            count: result.count,
        });
    } catch (error) {
        console.error('Error fetching operator venues:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch venues',
        });
    }
};

const getOperatorVenueById = async (req, res) => {
    try {
        const venue = await venueService.getOperatorVenueById(req.params.id, req.user.id);
        res.json({
            success: true,
            data: venue,
        });
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to fetch venue',
        });
    }
};

const createVenue = async (req, res) => {
    try {
        const venue = await venueService.createVenue(req.user.id, req.dto, req.body);
        res.status(201).json({
            success: true,
            message: 'Venue created successfully. Pending admin approval.',
            data: venue,
        });
    } catch (error) {
        console.error('Error creating venue:', error);
        res.status(error.message.includes('Invalid') ? 400 : 500).json({
            success: false,
            message: error.message || 'Failed to create venue',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

const updateVenue = async (req, res) => {
    try {
        const venue = await venueService.updateVenue(req.params.id, req.user.id, req.dto, req.body);
        res.json({
            success: true,
            message: 'Venue updated successfully',
            data: venue,
        });
    } catch (error) {
        console.error('Error updating venue:', error);
        res.status(error.message.includes('not found') ? 404 : (error.message.includes('Invalid') ? 400 : 500)).json({
            success: false,
            message: error.message || 'Failed to update venue',
        });
    }
};

const deleteVenue = async (req, res) => {
    try {
        await venueService.deleteVenue(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Venue deactivated successfully',
        });
    } catch (error) {
        console.error('Error deleting venue:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to delete venue',
        });
    }
};

const permanentDeleteVenue = async (req, res) => {
    try {
        await venueService.permanentDeleteVenue(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Venue permanently deleted. This action cannot be undone.',
        });
    } catch (error) {
        console.error('Error permanently deleting venue:', error);
        let status = 500;
        if (error.message.includes('not found')) status = 404;
        else if (error.message.includes('active booking(s)')) status = 400;

        res.status(status).json({
            success: false,
            message: error.message || 'Failed to permanently delete venue',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

const addVenueImages = async (req, res) => {
    try {
        const result = await venueService.addVenueImages(req.params.id, req.user.id, req.files, req.body.primaryIndex);
        res.status(201).json({
            success: true,
            message: `${result.count} image(s) uploaded successfully`,
            data: result,
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        let status = 500;
        if (error.message.includes('not found')) status = 404;
        else if (error.message.includes('required')) status = 400;

        res.status(status).json({
            success: false,
            message: error.message || 'Failed to upload images',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

const deleteVenueImage = async (req, res) => {
    try {
        await venueService.deleteVenueImage(req.params.venueId, req.params.imageId, req.user.id);
        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to delete image',
        });
    }
};

const updateOperatingHours = async (req, res) => {
    try {
        const operatingHours = await venueService.updateOperatingHours(req.params.id, req.user.id, req.body.operatingHours);
        res.json({
            success: true,
            message: 'Operating hours updated successfully',
            data: operatingHours,
        });
    } catch (error) {
        console.error('Error updating operating hours:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to update operating hours',
        });
    }
};

const getOperatorDashboard = async (req, res) => {
    try {
        const data = await venueService.getOperatorDashboard(req.user.id);
        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
        });
    }
};

const getOperatorAnalytics = async (req, res) => {
    try {
        const period = parseInt(req.query.period) || 30;
        const data = await venueService.getOperatorAnalytics(req.user.id, period);
        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error fetching operator analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data',
        });
    }
};

module.exports = {
    // Public
    getVenues,
    getVenueById,
    getPublicStats,
    getCities,
    // Operator
    getOperatorVenues,
    getOperatorVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    permanentDeleteVenue,
    addVenueImages,
    deleteVenueImage,
    updateOperatingHours,
    getOperatorDashboard,
    getOperatorAnalytics,
};
