const express = require('express');
const router = express.Router();
const { submitContactForm, getInquiries, updateInquiryStatus } = require('../controllers/contact.controller');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { 
    validateSubmitContact, 
    validateUpdateInquiryStatus 
} = require('../validators/contact.validator');

// Public route for anyone to submit an inquiry
router.post('/', validateSubmitContact, submitContactForm);

// Admin routes for viewing and resolving inquiries
router.get('/admin', auth, isAdmin, getInquiries);
router.patch('/admin/:id', auth, isAdmin, validateUpdateInquiryStatus, updateInquiryStatus);

module.exports = router;
