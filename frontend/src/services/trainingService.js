import api from './api';

const trainingService = {
    // Public
    getAllVideos: async (params) => {
        const response = await api.get('/training', { params });
        return response.data;
    },

    // Admin
    adminGetAllVideos: async (params) => {
        const response = await api.get('/training/admin/all', { params });
        return response.data;
    },
    adminCreateVideo: async (formData, config) => {
        const response = await api.post('/training/admin', formData, config);
        return response.data;
    },
    adminUpdateVideo: async (id, formData, config) => {
        const response = await api.put(`/training/admin/${id}`, formData, config);
        return response.data;
    },
    adminDeleteVideo: async (id) => {
        const response = await api.delete(`/training/admin/${id}`);
        return response.data;
    },

    // Operator
    getMyUploaderStatus: async () => {
        const response = await api.get('/training/my-uploader-status');
        return response.data;
    },
    operatorGetMyVideos: async (params) => {
        const response = await api.get('/training/operator/my-videos', { params });
        return response.data;
    },
    operatorRequestUpload: async () => {
        const response = await api.post('/training/request-upload');
        return response.data;
    },
    operatorCreateVideo: async (formData, config) => {
        const response = await api.post('/training/operator', formData, config);
        return response.data;
    },
    operatorUpdateVideo: async (id, formData, config) => {
        const response = await api.put(`/training/operator/${id}`, formData, config);
        return response.data;
    },
    operatorDeleteVideo: async (id) => {
        const response = await api.delete(`/training/operator/${id}`);
        return response.data;
    }
};

export default trainingService;
