const express = require('express');
const {isAuthenticatedUser,authorizeRoles} = require('../../middleware/auth')
const {getPrescription,prescription} = require('../../Controller/Doctor/Doctor');

const router = express.Router();

router.route('/prescription').post(isAuthenticatedUser,authorizeRoles("doctor"),prescription);
router.route('/get-prescription').get(isAuthenticatedUser,authorizeRoles("doctor"),getPrescription);

module.exports = router;