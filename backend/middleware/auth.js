const User = require('../Model/Users');
const jwt = require('jsonwebtoken');

exports.isAuthenticatedUser = async function(req, res, next){
    try {
        const token = req.header('token');

        if (!req.session.uid || !token) {
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: "Please Login To Access"
            });
        }

        let decodedData;
        try {
            decodedData = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ success: false, message: "Invalid or expired token, please login again" });
        }

        const user = await User.findById(decodedData.id);

        // The token and the session must belong to the same user.
        if (!user || Number(user.userId) !== Number(req.session.uid)) {
            req.session.destroy();
            return res.status(401).json({ success: false, message: "Please Login To Access" });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};


exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.orgName)) {
            return res.status(403).json({
                success: false,
                message: `${req.user ? req.user.orgName : 'This'} role not allowed`
            });
        }
        next();
    }
}
