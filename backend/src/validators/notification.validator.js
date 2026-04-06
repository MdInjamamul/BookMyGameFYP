const { param } = require('express-validator');
const validate = require('../middleware/validate');

const validateNotificationId = [
    param('id').isUUID().withMessage('Invalid notification ID'),
    validate
];

module.exports = {
    validateNotificationId
};
