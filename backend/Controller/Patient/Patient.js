const User = require('../../Model/Users');
const query = require('../../app/query');
const { loadPatientRecords } = require('../../app/records');
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
logger.level = 'debug';

const PROVIDER_ROLES = ['doctor', 'pharmacy', 'lab', 'insurance'];
const LEDGER_GETTER = { doctor: 'getDoctor', pharmacy: 'getPharmacy', lab: 'getLab', insurance: 'getInsurance', patient: 'getPatient' };

const sameId = (a, b) => Number(a) === Number(b);

// Patient grants a provider access to their records. Access is stored on both users.
exports.giveAccess = async (req, res, next) => {
    try {
        const accessId = Number(req.body.accessId);
        const patientId = Number(req.session.uid);
        if (!Number.isFinite(accessId)) {
            return res.status(400).json({ success: false, message: 'accessId is missing or invalid' });
        }

        const [patient, provider] = await Promise.all([
            User.findOne({ userId: patientId }),
            User.findOne({ userId: accessId }),
        ]);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        if (!provider || !PROVIDER_ROLES.includes(provider.orgName)) {
            return res.status(404).json({ success: false, message: 'Provider not found' });
        }
        if ((patient.access || []).some((id) => sameId(id, accessId))) {
            return res.status(200).json({ success: false, message: 'Already has access to your ID.' });
        }

        await User.updateOne({ userId: patientId }, { $addToSet: { access: accessId } });
        await User.updateOne({ userId: accessId }, { $addToSet: { access: patientId } });
        return res.status(200).json({ success: true, message: 'access given successfully' });
    } catch (error) {
        next(error);
    }
};

// Patient revokes a provider's access.
exports.removeAccess = async (req, res, next) => {
    try {
        const accessId = Number(req.body.accessId);
        const patientId = Number(req.session.uid);
        if (!Number.isFinite(accessId)) {
            return res.status(400).json({ success: false, message: 'accessId is missing or invalid' });
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        if (!(patient.access || []).some((id) => sameId(id, accessId))) {
            return res.status(200).json({ success: false, message: 'Access not given already' });
        }

        // $pull with both number and string forms: older entries may have been stored as strings.
        await User.updateOne({ userId: patientId }, { $pull: { access: { $in: [accessId, String(accessId)] } } });
        await User.updateOne({ userId: accessId }, { $pull: { access: { $in: [patientId, String(patientId)] } } });
        return res.status(200).json({ success: true, message: 'access removed successfully' });
    } catch (error) {
        next(error);
    }
};

// All providers of one type, read from the ledger, plus the ids this patient has granted access to.
exports.UserList = async (req, res, next) => {
    try {
        const orgName = req.params.orgName;
        if (!PROVIDER_ROLES.includes(orgName)) {
            return res.status(400).json({ success: false, message: 'Invalid Organization name' });
        }
        const userData = await User.findOne({ userId: req.session.uid });
        if (!userData) return res.status(404).json({ success: false, message: 'User not found' });

        const users = await User.find({ orgName });
        const records = (
            await Promise.all(
                users.map((u) =>
                    query.query('main-channel1', 'chaincode1', [String(u.userId)], LEDGER_GETTER[orgName], userData.userName, 'patient').catch(() => null)
                )
            )
        ).filter((r) => r && typeof r === 'object'); // skip users that are not on the ledger

        const access = (userData.access || []).map(Number);
        return res.status(200).json({ success: true, records, access });
    } catch (error) {
        next(error);
    }
};

// All four patient record endpoints return the same complete records (read fresh from the ledger),
// so each page can show prescriptions, dispensing, lab reports and claims consistently.
const sendRecords = async (req, res, next) => {
    try {
        const recordsData = await loadPatientRecords(req.session.uid);
        return res.status(200).json({ success: true, recordsData });
    } catch (error) {
        next(error);
    }
};

exports.HealthRecords = sendRecords;
exports.LabRecords = sendRecords;
exports.PharmacyRecords = sendRecords;
exports.InsuranceRecords = sendRecords;
