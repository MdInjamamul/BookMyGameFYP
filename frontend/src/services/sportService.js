import api from './api';

const sportService = {
    getSports: async () => {
        const response = await api.get('/sports');
        return response.data;
    },
    getSportsWithVenueCounts: async () => {
        const response = await api.get('/sports/with-venue-counts');
        return response.data;
    }
};

export default sportService;
