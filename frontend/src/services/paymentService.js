import api from './api';

const paymentService = {
    // Bookings
    initiateBookingPayment: async (data) => {
        const response = await api.post('/payments/khalti/initiate', data);
        return response.data;
    },
    retryBookingPayment: async (data) => {
        const response = await api.post('/payments/khalti/retry-booking', data);
        return response.data;
    },

    // Events
    initiateEventPayment: async (data) => {
        const response = await api.post('/payments/khalti/initiate-event', data);
        return response.data;
    },
    retryEventPayment: async (data) => {
        const response = await api.post('/payments/khalti/retry-event', data);
        return response.data;
    },

    // Verification
    verifyPayment: async (params) => {
        const response = await api.get('/payments/khalti/verify', { params });
        return response.data;
    }
};

export default paymentService;
