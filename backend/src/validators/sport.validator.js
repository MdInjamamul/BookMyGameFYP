const { body } = require('express-validator');
const validate = require('../middleware/validate');

const validateCreateSport = [
    body('name')
        .isString().withMessage('Sport name must be a string')
        .trim()
        .notEmpty().withMessage('Sport name is required')
        .isLength({ max: 50 }).withMessage('Sport name must not exceed 50 characters'),
    body('description')
        .optional({ checkFalsy: true })
        .isString().withMessage('Description must be a string')
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('iconUrl')
        .optional({ checkFalsy: true })
        .isString().withMessage('Icon URL must be a string')
        .trim()
        .isLength({ max: 255 }).withMessage('Icon URL must not exceed 255 characters'),
    validate
];

module.exports = {
    validateCreateSport
};
