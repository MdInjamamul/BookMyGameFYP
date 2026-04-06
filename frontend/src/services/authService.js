import apiClient from './api'

/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Uses the shared apiClient for consistent token handling and error interceptors
 */

const authService = {
  /**
   * Register a new user
   * Note: Token is NOT returned on signup - user must verify email first
   */
  async signup(userData) {
    const response = await apiClient.post('/auth/signup', userData)
    // Signup doesn't return a token - user must verify email before logging in
    return response.data
  },

  /**
   * Login user
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token)
    }
    return response.data
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No token found')
    }
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    const response = await apiClient.get(`/auth/verify-email/${token}`)
    return response.data
  },

  /**
   * Resend verification email
   */
  async resendVerification(email) {
    const response = await apiClient.post('/auth/resend-verification', {
      email,
    })
    return response.data
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    })
    return response.data
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('token')
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('token')
  },

  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  /**
   * Upload profile image
   */
  async uploadProfileImage(formData) {
    const response = await apiClient.post('/auth/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  /**
   * Update profile
   */
  async updateProfile(profileData) {
    const response = await apiClient.put('/auth/profile', profileData)
    return response.data
  },

  /**
   * Update password
   */
  async updatePassword(passwordData) {
    const response = await apiClient.put('/auth/password', passwordData)
    return response.data
  },
}

export default authService
