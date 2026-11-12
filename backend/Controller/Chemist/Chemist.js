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
const { loadPatientRecords } = require('../../app/records');
logger.level = 'debug';
function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

exports.medicineRecord = async (req,res,next)=>{

    const patientId = req.body.patientId;
    const recordId = req.body.recordId;
    const medicineBill = req.body.medicineBill;
    const medicines = req.body.medicines;
    // const username = req.body.username;
    const orgName = "pharmacy";
    const transient = {};
    const args = [ recordId, medicineBill, medicines];

    try {
        // MongoDB access code to check if pharmacy has access to this patient
        const { user, allowed } = await checkAccess(req.session.uid, patientId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!allowed) {
            return res.status(403).json({ success: false, message: `You do not have right to read the prescription for this user` });
        }

        // The record must belong to this patient (access to one patient must not allow editing another's record).
        const record = await Record.findOne({ RecordId: Number(recordId), patientId: Number(patientId) });
        if (!record) {
            return res.status(404).json({ success: false, message: `Record ${recordId} not found for this patient` });
        }
        const bill = Number(medicineBill);
        if (!Array.isArray(medicines) || medicines.length === 0 || !medicines.every((m) => m && typeof m.name === 'string')) {
            return res.status(400).json({ success: false, message: "medicines must be a non-empty list" });
        }
        if (!Number.isFinite(bill) || bill < 0) {
            return res.status(400).json({ success: false, message: "medicineBill must be a positive number" });
        }
        args[1] = String(bill);

        // invoke code to update the medicalRecord with recordId
        const message = await invoke.invokeTransaction("main-channel1", "chaincode1", "medicineDispensed", args, user.userName, orgName, transient);
        console.log("medicineDispensed result: ", message);

        if (isLedgerError(message)) {
            return res.status(500).json({ success: false, message: `Failed to write medicine data to the ledger: ${message}` });
        }

        return res.status(200).json({
            success: true,
            message: "Medicine Data updated successfully"
        });
    } catch (error) {
        logger.error("medicineRecord error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}



exports.getMedicineRecord = async (req,res,next)=>{

    try {
        const patientId = Number(req.query.patientId);

        const { allowed } = await checkAccess(req.session.uid, patientId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: `You do not have right to read the prescription for this user` });
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Full records, read fresh from the ledger (prescription, dispensing, lab reports, claim).
        const recordsData = await loadPatientRecords(patientId);

        return res.status(200).json({ success: true, recordsData });
    } catch (error) {
        logger.error("getMedicineRecord error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}