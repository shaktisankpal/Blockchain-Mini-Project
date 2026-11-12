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

exports.labReports = async (req, res, next) => {

    const patientId = req.body.patientId;
    const recordId = req.body.recordId;
    const labReport = req.body.labReport;
    const labBill = req.body.labBill;

    // while(true){
    //     var recordId = Math.floor(10000 + Math.random() * 90000);
    //     const us = await Record.findOne({ recordId }).select("+password");
    //     if(us){
    //         continue
    //     }else{
    //         break
    //     }
    // }

    // const labBill = req.body.labBill;

    // while(true){
    //     var labBill = Math.floor(10000 + Math.random() * 90000);
    //     const us = await Record.findOne({ recordId }).select("+password");
    //     if(us){
    //         continue
    //     }else{
    //         break
    //     }
    // }
    // const username = req.body.username;
    const orgName = "lab";
    const transient = {};
    const args = [recordId, labReport, labBill];

    try {
        const { user, allowed } = await checkAccess(req.session.uid, patientId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!allowed) {
            return res.status(403).json({ success: false, message: `You do not have right to update the lab report for this user` });
        }

        // The record must belong to this patient (access to one patient must not allow editing another's record).
        const record = await Record.findOne({ RecordId: Number(recordId), patientId: Number(patientId) });
        if (!record) {
            return res.status(404).json({ success: false, message: `Record ${recordId} not found for this patient` });
        }
        const bill = Number(labBill);
        if (!Array.isArray(labReport) || labReport.length === 0 || !labReport.every((t) => t && typeof t.name === 'string')) {
            return res.status(400).json({ success: false, message: "labReport must be a non-empty list of tests" });
        }
        if (!Number.isFinite(bill) || bill < 0) {
            return res.status(400).json({ success: false, message: "labBill must be a positive number" });
        }
        args[2] = String(bill);

        const message = await invoke.invokeTransaction("main-channel1", "chaincode1", "addLabTestReport", args, user.userName, orgName, transient);
        console.log("addLabTestReport result: ", message);

        if (isLedgerError(message)) {
            return res.status(500).json({ success: false, message: `Failed to write lab report to the ledger: ${message}` });
        }

        return res.status(200).json({
            success: true,
            message: "Lab Report updated successfully"
        });
    } catch (error) {
        logger.error("labReports error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

exports.getLabReport = async (req, res, next) => {

    try {
        const patientId = Number(req.query.patientId);

        const { allowed } = await checkAccess(req.session.uid, patientId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: `You do not have right to view lab reports for this user` });
        }

        const patient = await User.findOne({ userId: patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Full records, read fresh from the ledger (prescription, dispensing, lab reports, claim).
        const recordsData = await loadPatientRecords(patientId);

        return res.status(200).json({ success: true, recordsData });
    } catch (error) {
        logger.error("getLabReport error: ", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}