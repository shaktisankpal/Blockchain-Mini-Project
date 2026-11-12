const express = require('express');
const {isAuthenticatedUser,authorizeRoles} = require('../../middleware/auth')
const {requestClaimRecord, claimResponse, getInsuranceRecord} = require('../../Controller/Insurance/Insurance');

const router = express.Router();

router.route('/claim-request').post(isAuthenticatedUser,authorizeRoles("patient"),requestClaimRecord);
router.route('/response-claim').post(isAuthenticatedUser,authorizeRoles("insurance"),claimResponse);
router.route('/get-insurance-record').get(isAuthenticatedUser,authorizeRoles("insurance","patient"),getInsuranceRecord);

module.exports = router;