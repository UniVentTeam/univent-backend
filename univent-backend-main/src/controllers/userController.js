const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const userProfile = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      faculty: user.faculty,
      department: user.department,
      preferences: user.preferences   // array de EnumEventType
    };

    res.json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, faculty, department, preferences } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName;
    if (faculty !== undefined) user.faculty = faculty;
    if (department !== undefined) user.department = department;

    if (preferences !== undefined) {
      user.preferences = Array.isArray(preferences) ? preferences : [];
    }

    await user.save();

    const userProfile = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      faculty: user.faculty,
      department: user.department,
      preferences: user.preferences
    };

    res.json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
