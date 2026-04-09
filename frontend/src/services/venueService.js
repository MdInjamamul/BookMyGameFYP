import apiClient from './api';

/**
 * Venue Service
 * Handles all venue-related API calls
 */

/**
 * Get all approved venues with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term
 * @param {string} params.sport - Sport name filter
 * @param {string} params.city - City filter
 * @param {number} params.minPrice - Minimum price filter
 * @param {number} params.maxPrice - Maximum price filter
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 */
export const getVenues = async (params = {}) => {
    const response = await apiClient.get('/venues', { params });
    return response.data;
};

/**
 * Get venue details by ID
 * @param {string} id - Venue ID
 */
export const getVenueById = async (id) => {
    const response = await apiClient.get(`/venues/${id}`);
    return response.data;
};

/**
 * Get featured venues (top-rated approved venues)
 * @param {number} limit - Number of venues to fetch
 */
export const getFeaturedVenues = async (limit = 6) => {
    const response = await apiClient.get('/venues', {
        params: { limit, page: 1 }
    });
    return response.data;
};

/**
 * Get all sports with venue counts
 */
export const getSportsWithVenueCounts = async () => {
    const response = await apiClient.get('/sports/with-venue-counts');
    return response.data;
};

/**
 * Get all sports
 */
export const getSports = async () => {
    const response = await apiClient.get('/sports');
    return response.data;
};

/**
 * Get public platform stats for landing page hero section
 * Returns: { totalVenues, totalBookings, totalCities }
 */
export const getPublicStats = async () => {
    const response = await apiClient.get('/venues/public-stats');
    return response.data;
};

/**
 * Get distinct city names from approved venues (for search dropdown)
 */
export const getCities = async () => {
    const response = await apiClient.get('/venues/cities');
    return response.data;
};

export default {
    getVenues,
    getVenueById,
    getFeaturedVenues,
    getSportsWithVenueCounts,
    getSports,
    getPublicStats,
    getCities,
};
