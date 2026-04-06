const adminService = require('../services/admin.service');

/**
 * Admin Controller
 * Handles HTTP requests, passes data to AdminService, and returns formatted responses.
 */

// ============================================
// DASHBOARD
// ============================================

const getAdminDashboard = async (req, res) => {
    try {
        const dashboardData = await adminService.getDashboardStats();
        res.json({
            success: true,
            data: dashboardData,
        });
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
};

// ============================================
// VENUE MANAGEMENT
// ============================================

const getPendingVenues = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const { venues, total } = await adminService.getPendingVenues({ page, limit });

        res.json({
            success: true,
            data: venues,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching pending venues:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending venues' });
    }
};

const getAllVenues = async (req, res) => {
    try {
        const { approvalStatus, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const { venues, total } = await adminService.getAllVenues({ approvalStatus, search, page, limit });

        res.json({
            success: true,
            data: venues,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch venues' });
    }
};

const getVenueForReview = async (req, res) => {
    try {
        const venue = await adminService.getVenueForReview(req.params.id);
        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }
        res.json({ success: true, data: venue });
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch venue' });
    }
};

const approveVenue = async (req, res) => {
    try {
        const updatedVenue = await adminService.approveVenue(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Venue approved successfully',
            data: updatedVenue,
        });
    } catch (error) {
        if (error.message === 'Venue not found') return res.status(404).json({ success: false, message: error.message });
        if (error.message === 'Venue is already approved') return res.status(400).json({ success: false, message: error.message });
        
        console.error('Error approving venue:', error);
        res.status(500).json({ success: false, message: 'Failed to approve venue' });
    }
};

const rejectVenue = async (req, res) => {
    try {
        const updatedVenue = await adminService.rejectVenue(req.params.id, req.user.id, req.body.reason);
        res.json({
            success: true,
            message: 'Venue rejected',
            data: updatedVenue,
        });
    } catch (error) {
        if (error.message === 'Venue not found') return res.status(404).json({ success: false, message: error.message });
        if (error.message === 'Venue is already rejected') return res.status(400).json({ success: false, message: error.message });
        
        console.error('Error rejecting venue:', error);
        res.status(500).json({ success: false, message: 'Failed to reject venue' });
    }
};

// ============================================
// USER MANAGEMENT
// ============================================

const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const { users, total } = await adminService.getAllUsers({ role, search, page, limit });

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { role, isVerified } = req.body;
        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (isVerified !== undefined) updateData.isVerified = isVerified;

        const updatedUser = await adminService.updateUser(req.params.id, req.user.id, updateData);
        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        if (error.message === 'User not found') return res.status(404).json({ success: false, message: error.message });
        if (error.message === 'You cannot change your own role') return res.status(400).json({ success: false, message: error.message });
        
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};

const deleteUser = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id, req.user.id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        if (error.message === 'User not found') return res.status(404).json({ success: false, message: error.message });
        if (['You cannot delete your own account', 'Cannot delete admin users'].includes(error.message)) {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

// ============================================
// SELLER REQUEST MANAGEMENT
// ============================================

const getSellerRequests = async (req, res) => {
    try {
        const requests = await adminService.getSellerRequests();
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching seller requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch seller requests' });
    }
};

const approveSellerRequest = async (req, res) => {
    try {
        const user = await adminService.approveSellerRequest(req.params.id);
        res.json({ success: true, message: `${user.fullName} has been approved as a seller` });
    } catch (error) {
        if (error.message === 'Operator not found') return res.status(404).json({ success: false, message: error.message });
        
        console.error('Error approving seller request:', error);
        res.status(500).json({ success: false, message: 'Failed to approve seller request' });
    }
};

const rejectSellerRequest = async (req, res) => {
    try {
        const user = await adminService.rejectSellerRequest(req.params.id);
        res.json({ success: true, message: `Seller request from ${user.fullName} has been rejected` });
    } catch (error) {
        if (error.message === 'Operator not found') return res.status(404).json({ success: false, message: error.message });
        
        console.error('Error rejecting seller request:', error);
        res.status(500).json({ success: false, message: 'Failed to reject seller request' });
    }
};

// ============================================
// VIDEO UPLOADER REQUEST MANAGEMENT
// ============================================

const getVideoUploaderRequests = async (req, res) => {
    try {
        const requests = await adminService.getVideoUploaderRequests();
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching video uploader requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch video uploader requests' });
    }
};

const approveVideoUploaderRequest = async (req, res) => {
    try {
        const user = await adminService.approveVideoUploaderRequest(req.params.id);
        res.json({ success: true, message: `${user.fullName} has been approved to upload training videos` });
    } catch (error) {
        if (error.message === 'Operator not found') return res.status(404).json({ success: false, message: error.message });
        
        console.error('Error approving video uploader request:', error);
        res.status(500).json({ success: false, message: 'Failed to approve video uploader request' });
    }
};

const rejectVideoUploaderRequest = async (req, res) => {
    try {
        const user = await adminService.rejectVideoUploaderRequest(req.params.id);
        res.json({ success: true, message: 'Video Uploader request has been rejected' });
    } catch (error) {
        if (error.message === 'Operator not found') return res.status(404).json({ success: false, message: error.message });
        
        console.error('Error rejecting video uploader request:', error);
        res.status(500).json({ success: false, message: 'Failed to reject video uploader request' });
    }
};

module.exports = {
    getAdminDashboard,
    getPendingVenues,
    getAllVenues,
    getVenueForReview,
    approveVenue,
    rejectVenue,
    getAllUsers,
    updateUser,
    deleteUser,
    getSellerRequests,
    approveSellerRequest,
    rejectSellerRequest,
    getVideoUploaderRequests,
    approveVideoUploaderRequest,
    rejectVideoUploaderRequest,
};
