import api from './api';

const bookingService = {
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  
  getUserBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  getBookingDetails: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  cancelBooking: async (bookingId, data) => {
    const response = await api.put(`/bookings/${bookingId}/cancel`, data);
    return response.data;
  }
};

export default bookingService;
