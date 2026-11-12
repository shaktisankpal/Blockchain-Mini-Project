const User = require('../../Model/Users');
const Record = require('../../Model/PaitientRecords');
const constants = require('../../config/constants.json')
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const helper = require('../../app/helper')
const invoke = require('../../app/invoke')
const qscc = require('../../app/qscc')
const query = require('../../app/query')
const jwt = require('jsonwebtoken');
const { checkAccess, isLedgerError } = require('../../app/access');
const { loadPatientRecords } = require('../../app/records');
logger.level = 'debug';
function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

exports.prescription = async (req, res, next) => {
    try {
        console.log("req.body: ", req.body);
        const patientId = Number(req.body.patientId);

        // The client sends args = [diagnosis, medicines, labTests, patientId].
        const [diagnosis, medicines, labTests] = req.body.args || [];

        if (!Number.isFinite(patientId)) {
            return res.status(400).json(getErrorMessage("'patientId'"));
        }
        if (!diagnosis) {
            return res.status(400).json(getErrorMessage("'diagnosis'"));
        }

        const { user, allowed } = await checkAccess(req.session.uid, patientId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!allowed) {
            return res.status(403).json({ success: false, message: `Doctor do not have right to write prescription for this user` });
        }

        let recordId;
        while (true) {
            recordId = Math.floor(10000 + Math.random() * 90000);
            const existing = await Record.findOne({ RecordId: recordId });
            if (!existing) {
                break;
            }
        }

        // Chaincode signature: createPrescriptionRecord(recordId, patientId, doctorId, diagnosis, medicines, labTests, createdAt)
        const args = [
            recordId,
            patientId,
            req.session.uid,
            diagnosis,
            medicines || [],
            labTests || [],
            new Date().toISOString()
        ];
        logger.debug("args: ", args);

        const response = await invoke.invokeTransaction("main-channel1", "chaincode1", "createPrescriptionRecord", args, user.userName, user.orgName, {});
        console.log("ledger message: ", response);

        if (isLedgerError(response)) {
            return res.status(500).json({ success: false, message: `Failed to write prescription to the ledger: ${response}` });
        }

        const records = await Record.create({
            doctorId: req.session.uid, patientId, RecordId: recordId
        });

        return res.status(200).json({ success: true, message: "Record Added Successfully", records });
    } catch (error) {
        logger.error("prescription error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getPrescription = async (req, res, next) => {
    try {
        const patientId = Number(req.query.patientId);

        const { allowed } = await checkAccess(req.session.uid, patientId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: `You do not have right to read prescriptions for this user` });
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Full records, read fresh from the ledger (prescription, dispensing, lab reports, claim).
        const recordsData = await loadPatientRecords(patientId);

        return res.status(200).json({ success: true, recordsData });
    } catch (error) {
        logger.error("getPrescription error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
