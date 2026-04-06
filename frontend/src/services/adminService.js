import api from './api';

const adminService = {
    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    // Venues
    getPendingVenues: async () => {
        const response = await api.get('/admin/venues/pending');
        return response.data;
    },
    
    getAllVenues: async (params) => {
        const response = await api.get(`/admin/venues?${params}`);
        return response.data;
    },

    getVenueForReview: async (id) => {
        const response = await api.get(`/admin/venues/${id}`);
        return response.data;
    },

    approveVenue: async (id) => {
        const response = await api.put(`/admin/venues/${id}/approve`);
        return response.data;
    },

    rejectVenue: async (id, reason) => {
        const response = await api.put(`/admin/venues/${id}/reject`, { reason });
        return response.data;
    },

    // Users
    getAllUsers: async (params) => {
        const response = await api.get(`/admin/users?${params}`);
        return response.data;
    },

    updateUser: async (id, data) => {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    // Seller Requests
    getSellerRequests: async () => {
        const response = await api.get('/admin/seller-requests');
        return response.data;
    },

    approveSellerRequest: async (id) => {
        const response = await api.put(`/admin/seller-requests/${id}/approve`);
        return response.data;
    },

    rejectSellerRequest: async (id) => {
        const response = await api.put(`/admin/seller-requests/${id}/reject`);
        return response.data;
    },

    // Video Uploader Requests
    getVideoUploaderRequests: async () => {
        const response = await api.get('/admin/video-uploader-requests');
        return response.data;
    },

    approveVideoUploaderRequest: async (id) => {
        const response = await api.put(`/admin/video-uploader-requests/${id}/approve`);
        return response.data;
    },

    rejectVideoUploaderRequest: async (id) => {
        const response = await api.put(`/admin/video-uploader-requests/${id}/reject`);
        return response.data;
    }
};

export default adminService;
