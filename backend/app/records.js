// Reads prescription records from the ledger and returns them in one consistent shape.
//
// On the ledger a record is keyed by its recordId and holds everything that happens to it:
// the doctor's prescription, the pharmacy's dispensed medicines + bill, the lab's reports + bill
// and the insurance claim. `medicines` and `labTests` are stored JSON-encoded (twice, because
// both the backend and the chaincode stringify them), so they are decoded here.
const User = require('../Model/Users');
const Record = require('../Model/PaitientRecords');
const query = require('./query');

const CHANNEL = 'main-channel1';
const CHAINCODE = 'chaincode1';

// JSON.parse until the value is no longer a JSON string (handles single and double encoding).
const parseDeep = (value) => {
    let v = value;
    for (let i = 0; i < 3 && typeof v === 'string'; i++) {
        try { v = JSON.parse(v); } catch (e) { break; }
    }
    return v;
};

const asArray = (value) => {
    const v = parseDeep(value);
    return Array.isArray(v) ? v : [];
};

// Only real dates; older records stored the patient id in createdAt.
const asDate = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (/^\d+$/.test(String(value))) return null;
    return Number.isNaN(Date.parse(value)) ? null : value;
};

const asAmount = (value) => {
    const v = parseDeep(value);
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const isTruthyFlag = (v) => v === true || v === 'true' || v === 'yes' || v === 'Yes';

function normalize(raw, names = {}) {
    const medicines = asArray(raw.medicines).map((m) => ({
        name: m.name || '',
        dose: m.dose || '',
        dispensed: m.dispensed === undefined || m.dispensed === '' ? null : isTruthyFlag(m.dispensed),
        comment: m.comment || '',
    }));
    const labTests = asArray(raw.labTests).map((t) => {
        const report = t.labReport && (t.labReport.report || t.labReport.report === 0) ? t.labReport : null;
        return {
            name: t.name || '',
            report: report ? String(report.report) : null,
            reportDate: report ? asDate(report.dateOfReport) : null,
        };
    });
    const medicineBill = asAmount(raw.medicineBill);
    const labBill = asAmount(raw.labBill);
    const ins = raw.insuranceRecord && raw.insuranceRecord.insuranceClaim ? raw.insuranceRecord : null;

    return {
        recordId: String(raw.recordId),
        patientId: String(raw.patientId),
        patientName: names[raw.patientId] || null,
        doctorId: String(raw.doctorId),
        doctorName: names[raw.doctorId] || null,
        diagnosis: raw.diagnosis || '',
        createdAt: asDate(raw.createdAt),
        medicines,
        medicineBill,
        dispensed: medicineBill !== null,
        labTests,
        labBill,
        labReported: labBill !== null || labTests.some((t) => t.report),
        insurance: ins
            ? {
                status: ins.status || 'in process',
                claimRequestDate: asDate(ins.claimRequestDate),
                claimResponseDate: asDate(ins.claimResponseDate),
            }
            : null,
    };
}

// userId -> userName for the given ids (one Mongo query).
async function nameMap(ids) {
    const unique = [...new Set(ids.filter(Boolean).map(Number).filter(Number.isFinite))];
    if (unique.length === 0) return {};
    const users = await User.find({ userId: { $in: unique } }, { userId: 1, userName: 1 });
    return Object.fromEntries(users.map((u) => [String(u.userId), u.userName]));
}

// Reads one record from the ledger using the patient's identity. Returns null if it can't be read.
async function readRecord(recordId, patientUserName) {
    const result = await query.query(CHANNEL, CHAINCODE, [String(recordId)], 'getPrescriptionRecord', patientUserName, 'patient');
    if (!result || typeof result !== 'object') return null;
    return result;
}

// All records of a patient, newest first, read fresh from the ledger.
async function loadPatientRecords(patientId) {
    const patient = await User.findOne({ userId: Number(patientId) });
    if (!patient) return [];
    const refs = await Record.find({ patientId: Number(patientId) });
    const raws = (await Promise.all(refs.map((r) => readRecord(r.RecordId, patient.userName).catch(() => null)))).filter(Boolean);
    const names = await nameMap(raws.flatMap((r) => [r.doctorId, r.patientId]));
    return raws
        .map((r) => normalize(r, names))
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}

module.exports = { parseDeep, normalize, loadPatientRecords, readRecord, nameMap };
