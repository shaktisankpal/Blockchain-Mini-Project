const User = require('../../Model/Users');
const constants = require('../../config/constants.json')
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const helper = require('../../app/helper')
const invoke = require('../../app/invoke')
const qscc = require('../../app/qscc')
const query = require('../../app/query')
const jwt = require('jsonwebtoken');
const Record = require('../../Model/PaitientRecords');
const { checkAccess, isLedgerError } = require('../../app/access');
const { loadPatientRecords, readRecord } = require('../../app/records');
logger.level = 'debug';
function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

// Called by a patient to request an insurance claim for one of their own records.
exports.requestClaimRecord = async (req, res, next) => {
    try {
        const patientId = Number(req.body.patientId);
        const recordId = Number(req.body.recordId);

        if (patientId !== Number(req.session.uid)) {
            return res.status(403).json({ success: false, message: `You can only request claims for your own records` });
        }

        const record = await Record.findOne({ RecordId: recordId, patientId });
        if (!record) {
            return res.status(404).json({ success: false, message: `Record ${recordId} not found for this patient` });
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // One claim per record; filing again would reset an approved/declined claim to "in process".
        const current = await readRecord(recordId, patient.userName);
        if (current && current.insuranceRecord && current.insuranceRecord.insuranceClaim) {
            return res.status(400).json({ success: false, message: `A claim was already filed for this record (${current.insuranceRecord.status})` });
        }

        const requestDate = new Date().toISOString();
        const message = await invoke.invokeTransaction("main-channel1", "chaincode1", "addClaimRequest", [recordId, requestDate], patient.userName, "patient", {});
        console.log("addClaimRequest result: ", message);

        if (isLedgerError(message)) {
            return res.status(500).json({ success: false, message: `Failed to write claim request to the ledger: ${message}` });
        }

        return res.status(200).json({ success: true, message });
    } catch (error) {
        logger.error("requestClaimRecord error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Called by an insurance company to approve/decline a claim.
exports.claimResponse = async (req, res, next) => {
    try {
        const { recordId, status } = req.body;
        const patientId = Number(req.body.patientId);
        const responseDate = (new Date()).toISOString();
        const args = [recordId, status, responseDate];

        const { user, allowed } = await checkAccess(req.session.uid, patientId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!allowed) {
            return res.status(403).json({ success: false, message: `You do not have right to respond to claims for this user` });
        }

        const record = await Record.findOne({ RecordId: Number(recordId), patientId });
        if (!record) {
            return res.status(404).json({ success: false, message: `Record ${recordId} not found for this patient` });
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        if (!['Approve', 'Decline'].includes(status)) {
            return res.status(400).json({ success: false, message: "status must be Approve or Decline" });
        }
        // Only a claim the patient actually filed, and that is still pending, can be answered.
        const current = await readRecord(recordId, patient.userName);
        const claim = current && current.insuranceRecord;
        if (!claim || !claim.insuranceClaim) {
            return res.status(400).json({ success: false, message: "The patient has not filed a claim for this record" });
        }
        if (claim.status !== 'in process') {
            return res.status(400).json({ success: false, message: `This claim was already answered (${claim.status})` });
        }

        const message = await invoke.invokeTransaction("main-channel1", "chaincode1", "addClaimResponse", args, patient.userName, "patient", {});
        console.log("addClaimResponse result: ", message);

        if (isLedgerError(message)) {
            return res.status(500).json({ success: false, message: `Failed to write claim response to the ledger: ${message}` });
        }

        return res.status(200).json({ success: true, message });
    } catch (error) {
        logger.error("claimResponse error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Returns claim records for a patient: the patient themselves, or a user the patient granted access to.
exports.getInsuranceRecord = async (req, res, next) => {
    try {
        const patientId = Number(req.query.patientId || req.session.uid);

        if (patientId !== Number(req.session.uid)) {
            const { allowed } = await checkAccess(req.session.uid, patientId);
            if (!allowed) {
                return res.status(403).json({ success: false, message: `You do not have right to read claims for this user` });
            }
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Full records, read fresh from the ledger (prescription, dispensing, lab reports, claim).
        const recordsData = await loadPatientRecords(patientId);

        return res.status(200).json({ success: true, recordsData });
    } catch (error) {
        logger.error("getInsuranceRecord error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
