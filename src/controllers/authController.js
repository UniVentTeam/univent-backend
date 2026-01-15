const User = require('../models/User');
const Association = require('../models/Association');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { sendOrganizerRequestWithAssociation } = require('../utils/emailService');


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailAndPassword(email, password) {
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push("Email is required");
  } else {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      errors.push("Invalid email format");
    }
  }

  if (!password || typeof password !== 'string') {
    errors.push("Password is required");
  } else {
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
  }

  return errors;
}


// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, faculty, associationId } = req.body;
    const errors = validateEmailAndPassword(email, password);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }
    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // create user according to Swagger
    const user = await User.create({
      email,
      fullName,
      password: hashed,
      faculty,
      role: "STUDENT",         // implicit pentru înregistrare
      department: null,
      preferences: []          // ⚠️ conform Swagger: ARRAY de EnumEventType
    });

    const token = generateToken(user);

    // If user requested to join an association as organizer
    if (associationId) {
      try {
        const association = await Association.findById(associationId);
        if (association) {
          // Find all admins to notify
          const admins = await User.find({ role: 'ADMIN' });
          const adminEmails = admins.map(a => a.email);
          
          if (adminEmails.length > 0) {
            await sendOrganizerRequestWithAssociation(adminEmails, user, association.name);
          }
        }
      } catch (emailErr) {
        console.error("Failed to send association request email:", emailErr);
        // We don't block registration if email fails
      }
    }

    // build UserProfile according to Swagger
    const userProfile = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      faculty: user.faculty,
      department: user.department,
      preferences: user.preferences
    };

    res.status(201).json({
      token,
      user: userProfile
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    const userProfile = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      faculty: user.faculty,
      department: user.department,
      preferences: user.preferences
    };

    res.json({
      token,
      user: userProfile
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
