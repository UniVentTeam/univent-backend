require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/database');
const User = require('./models/User');
const Association = require('./models/Association');

const createOrganizer = async () => {
    try {
        await connectDB();

        const email = 'organizer@usv.ro';
        let user = await User.findOne({ email });

        if (user) {
            console.log('✅ Organizer user already exists.');
        } else {
            const hashedPassword = await bcrypt.hash('organizer123', 10);
            user = await User.create({
                email,
                fullName: 'USV Organizer',
                password: hashedPassword,
                role: 'ORGANIZER',
                faculty: 'FIESC',
                department: 'Calculatoare',
                preferences: []
            });
            console.log('🎉 Organizer user created successfully!');
        }

        // Check for Association
        let assoc = await Association.findOne({ name: 'LS AC' });
        if (!assoc) {
            assoc = await Association.create({
                name: 'LS AC',
                type: 'STUDENT_ORG',
                description: 'Liga Studentilor la AC',
                admins: [user._id]
            });
            console.log('🎉 Association "LS AC" created and linked to organizer!');
        } else {
            if (!assoc.admins.includes(user._id)) {
                assoc.admins.push(user._id);
                await assoc.save();
                console.log('✅ Association "LS AC" updated with new admin.');
            } else {
                console.log('✅ Organizer is already admin of "LS AC".');
            }
        }

    } catch (err) {
        console.error('❌ Error creating organizer/association:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createOrganizer();
