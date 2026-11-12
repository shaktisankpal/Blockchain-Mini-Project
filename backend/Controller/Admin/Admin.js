const User = require('../../Model/Users');
const constants = require('../../config/constants.json')
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const helper = require('../../app/helper')
const invoke = require('../../app/invoke')
const qscc = require('../../app/qscc')
const query = require('../../app/query')
const jwt = require('jsonwebtoken');
const { isLedgerError } = require('../../app/access');
const { loadPatientRecords } = require('../../app/records');

const LEDGER_GETTER = { doctor: 'getDoctor', patient: 'getPatient', lab: 'getLab', pharmacy: 'getPharmacy', insurance: 'getInsurance' };
logger.level = 'debug';
function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

// Org -> chaincode function used when an admin registers a non-patient user.
const ADMIN_REGISTER_FCN = {
    doctor: "registerDoctor",
    lab: "registerLab",
    pharmacy: "registerPharmacy",
    insurance: "registerInsurance"
};

/**
 * Shared registration flow:
 *   1. enroll the user with the org's Fabric CA (wallet identity),
 *   2. write the user to the ledger,
 *   3. only if the ledger write succeeded, create the MongoDB login.
 * A failed ledger write is reported as a failure instead of a fake success,
 * and no MongoDB user is created (so the username can be retried).
 */
const registerUser = async (req, res, { orgName, fcn, loginAsNewUser }) => {
    const username = req.body.username;
    const password = req.body.password;
    const args = Array.isArray(req.body.args) ? [...req.body.args] : [];

    if (!username) {
        return res.status(400).json(getErrorMessage('\'username\''));
    }
    if (!password || String(password).length < 8) {
        return res.status(400).json({ success: false, message: "Password should have atleast 8 chars" });
    }

    const existing = await User.findOne({ userName: username });
    if (existing) {
        return res.status(400).json({ success: false, message: "User Already Exits" });
    }

    let userId;
    while (true) {
        userId = Math.floor(100000 + Math.random() * 900000);
        const us = await User.findOne({ userId });
        if (!us) {
            break;
        }
    }

    // wallet (Fabric CA enrollment)
    const enrollment = await helper.getRegisteredUser(username, orgName, true);
    if (!enrollment || typeof enrollment === 'string') {
        logger.debug('Failed to enroll the username %s for organization %s with::%s', username, orgName, enrollment);
        return res.status(500).json({ success: false, message: `Failed to enroll user with the ${orgName} CA: ${enrollment}` });
    }

    // ledger
    args.unshift(userId);
    logger.debug('args: ', args);
    const ledgerResponse = await invoke.invokeTransaction("main-channel1", "chaincode1", fcn, args, username, orgName, {});
    console.log("ledger message: ", ledgerResponse);

    if (isLedgerError(ledgerResponse)) {
        logger.debug('Failed to write the username %s for organization %s to the ledger with::%s', username, orgName, ledgerResponse);
        return res.status(500).json({ success: false, message: `Failed to add user to the ledger: ${ledgerResponse}` });
    }

    logger.debug('Successfully registered the username %s for organization %s', username, orgName);
    const user = await User.create({
        userName: username, orgName, password, userId
    });

    if (loginAsNewUser) {
        req.session.uid = user.userId;
        req.session.role = user.orgName;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    return res.json({
        success: true,
        message: ledgerResponse.message,
        token,
        userName: user.userName,
        userId: user.userId,
        orgName: user.orgName
    });
}

// Admin-only: registers doctors, labs, pharmacies and insurance companies.
exports.register = async (req, res, next) => {
    try {
        const orgName = req.body.orgName;
        const fcn = ADMIN_REGISTER_FCN[orgName];
        if (!fcn) {
            return res.status(400).json(getErrorMessage('\'orgName\''));
        }
        // The admin stays logged in as the admin (do not switch the session to the new user).
        return await registerUser(req, res, { orgName, fcn, loginAsNewUser: false });
    } catch (error) {
        logger.error("register error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Public: self-registration is only allowed for patients.
exports.registerPatient = async (req, res, next) => {
    try {
        return await registerUser(req, res, { orgName: "patient", fcn: "registerPatient", loginAsNewUser: true });
    } catch (error) {
        logger.error("registerPatient error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.Login = async (req, res, next) => {
    try {
        const { username, orgName, password } = req.body || {};
        logger.debug('End point : /users');
        logger.debug('User name : ' + username);
        logger.debug('Org name  : ' + orgName);

        if (!username) return res.status(400).json(getErrorMessage("'username'"));
        if (!orgName) return res.status(400).json(getErrorMessage("'orgName'"));
        if (!password) return res.status(400).json(getErrorMessage("'password'"));

        const user = await User.findOne({ userName: username }).select('+password');
        // Same message for unknown user, wrong organisation and wrong password.
        if (!user || user.orgName !== orgName || !(await user.comparePassword(String(password)))) {
            return res.status(400).json({ success: false, message: 'Invalid username, organization or password' });
        }

        if (orgName !== 'Admin') {
            const isUserRegistered = await helper.isUserRegistered(username, orgName);
            if (!isUserRegistered) {
                return res.status(400).json({ success: false, message: `User with username ${username} is not registered with ${orgName}, Please register first.` });
            }
        }

        req.session.uid = user.userId;
        req.session.role = user.orgName;
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1d' });
        return res.status(200).json({ success: true, token, userName: user.userName, orgName: user.orgName, userId: user.userId });
    } catch (error) {
        next(error);
    }
};

// The logged-in user plus the people they are linked to through access grants:
// - a patient gets the providers they granted access to (ledger profiles),
// - a provider gets the patients who granted them access, each with fresh, complete records.
exports.getUserDetails = async (req, res, next) => {
    try {
        const result = await User.findOne({ userId: req.session.uid });
        if (!result) return res.status(404).json({ success: false, message: 'User not found' });

        const linked = await User.find({ userId: { $in: (result.access || []).map(Number) } });
        const accessMemberDetails = (
            await Promise.all(
                linked.map(async (member) => {
                    const fcn = LEDGER_GETTER[member.orgName];
                    if (!fcn) return null;
                    const profile = await query.query('main-channel1', 'chaincode1', [String(member.userId)], fcn, member.userName, member.orgName).catch(() => null);
                    if (!profile || typeof profile !== 'object') return null; // not on the ledger
                    if (member.orgName === 'patient') {
                        profile.medicalRecords = await loadPatientRecords(member.userId);
                    }
                    return profile;
                })
            )
        ).filter(Boolean);

        return res.status(200).json({ success: true, result, accessMemberDetails, status: 'success' });
    } catch (error) {
        next(error);
    }
};
