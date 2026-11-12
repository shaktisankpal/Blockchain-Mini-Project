const express = require('express');
const {isAuthenticatedUser,authorizeRoles} = require('../../middleware/auth')
const {medicineRecord,getMedicineRecord} = require('../../Controller/Chemist/Chemist');

const router = express.Router();

router.route('/medicine-record').post(isAuthenticatedUser,authorizeRoles("pharmacy"),medicineRecord);
router.route('/get-medicine-record').get(isAuthenticatedUser,authorizeRoles("pharmacy"),getMedicineRecord);

module.exports = router;