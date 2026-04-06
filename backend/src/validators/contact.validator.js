const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const validateSubmitContact = [
    body('name')
        .isString().withMessage('Name must be a string')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('email')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('subject')
        .isString().withMessage('Subject must be a string')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .isLength({ max: 200 }).withMessage('Subject must not exceed 200 characters'),
    body('message')
        .isString().withMessage('Message must be a string')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 5000 }).withMessage('Message must not exceed 5000 characters'),
    validate
];

const validateUpdateInquiryStatus = [
    param('id').isUUID().withMessage('Invalid inquiry ID'),
    body('status')
        .isIn(['pending', 'resolved']).withMessage('Status must be either "pending" or "resolved"'),
    validate
];

module.exports = {
    validateSubmitContact,
    validateUpdateInquiryStatus
};
