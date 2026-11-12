// Creates (or resets the password of) the Admin login in MongoDB.
//
// Usage (from the backend folder, with MONGO_URI set or in .env):
//   node scripts/createAdmin.js <username> <password>
//
// The password is hashed by the User model's pre-save hook (bcrypt), which is
// what the login endpoint expects. Inserting a plain-text password directly
// into MongoDB does not work.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Model/Users');

const [username, password] = process.argv.slice(2);

const main = async () => {
    if (!username || !password) {
        console.error('Usage: node scripts/createAdmin.js <username> <password>');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
    }
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not set (add it to backend/.env).');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    let admin = await User.findOne({ userName: username }).select('+password');
    if (admin) {
        if (admin.orgName !== 'Admin') {
            console.error(`User "${username}" already exists in org "${admin.orgName}".`);
            process.exit(1);
        }
        admin.password = password;
        await admin.save();
        console.log(`Updated password for admin "${username}".`);
    } else {
        let userId;
        do {
            userId = Math.floor(100000 + Math.random() * 900000);
        } while (await User.findOne({ userId }));

        admin = await User.create({ userName: username, orgName: 'Admin', userId, password });
        console.log(`Created admin "${username}" (userId ${admin.userId}).`);
    }

    await mongoose.disconnect();
};

main().catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
