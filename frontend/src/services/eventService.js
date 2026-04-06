import apiClient from './api';

/**
 * Event Service
 * Handles all event-related API calls
 */

/**
 * Get all events with optional filters
 * @param {Object} params - Query parameters
 */
export const getEvents = async (params = {}) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
};

/**
 * Get featured events (top upcoming featured events)
 */
export const getFeaturedEvents = async () => {
    const response = await apiClient.get('/events/featured');
    return response.data;
};

/**
 * Get single event details by ID
 * @param {string} id - Event ID
 */
export const getEventById = async (id) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
};

/**
 * Register for an event
 * @param {string} id - Event ID
 */
export const registerForEvent = async (id) => {
    const response = await apiClient.post(`/events/${id}/register`);
    return response.data;
};

/**
 * Cancel event registration
 * @param {string} id - Event ID
 */
export const cancelRegistration = async (id) => {
    const response = await apiClient.delete(`/events/${id}/register`);
    return response.data;
};

/**
 * Get user's event registrations
 * @param {Object} params - Query parameters (e.g. status filter)
 */
export const getMyRegistrations = async (params = {}) => {
    const response = await apiClient.get('/events/my-registrations', { params });
    return response.data;
};

export default {
    getEvents,
    getFeaturedEvents,
    getEventById,
    registerForEvent,
    cancelRegistration,
    getMyRegistrations,
};
