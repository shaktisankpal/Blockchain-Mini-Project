const User = require('../Model/Users');

/**
 * Loads a user and checks whether `otherId` is in their access list.
 * IDs are compared as numbers: access lists store numbers, but IDs coming
 * from query strings (and some request bodies) arrive as strings.
 */
const checkAccess = async (userId, otherId) => {
    const user = await User.findOne({ userId: Number(userId) });
    if (!user) {
        return { user: null, allowed: false };
    }
    const target = Number(otherId);
    const allowed = Number.isFinite(target) && (user.access || []).some((id) => Number(id) === target);
    return { user, allowed };
};

/**
 * invoke.invokeTransaction() returns an object ({ message, result }) on success
 * and a plain error string on failure. Use this to tell the two apart.
 */
const isLedgerError = (response) => !response || typeof response === 'string';

module.exports = { checkAccess, isLedgerError };
