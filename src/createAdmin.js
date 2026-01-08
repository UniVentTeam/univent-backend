require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/database');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        await connectDB();

        const email = 'admin@usv.ro';
        const exists = await User.findOne({ email });

        if (exists) {
            console.log('✅ Admin user already exists.');
            console.log('Email:', email);
            console.log('If you forgot the password, you may need to manually delete this user or update the script.');
        } else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                email,
                fullName: 'Super Admin',
                password: hashedPassword,
                role: 'ADMIN',
                faculty: 'Administratie',
                department: 'IT',
                preferences: []
            });
            console.log('🎉 Admin user created successfully!');
            console.log('Email:', email);
            console.log('Password: admin123');
        }
    } catch (err) {
        console.error('❌ Error creating admin:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createAdmin();
