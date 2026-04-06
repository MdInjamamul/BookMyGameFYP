const { param, body } = require('express-validator');
const validate = require('../middleware/validate');

const validateIdParam = [
    param('id').isUUID().withMessage('Invalid ID format'),
    validate
];

const validateVenueRejection = [
    param('id').isUUID().withMessage('Invalid venue ID'),
    body('reason')
        .isString().withMessage('Rejection reason must be a string')
        .trim()
        .notEmpty().withMessage('Rejection reason is required')
        .isLength({ max: 500 }).withMessage('Rejection reason must not exceed 500 characters'),
    validate
];

const validateUserUpdate = [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('role')
        .optional()
        .isIn(['user', 'operator', 'admin']).withMessage('Invalid role value'),
    body('isVerified')
        .optional()
        .isBoolean().withMessage('isVerified must be a boolean'),
    validate
];

module.exports = {
    validateIdParam,
    validateVenueRejection,
    validateUserUpdate
};
