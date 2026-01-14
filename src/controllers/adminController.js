const mongoose = require('mongoose');
const User = require('../models/User');
const EnumUserRole = require('../models/enums/userRole.enum');

const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('_id fullName email role')
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    if (!role || !EnumUserRole.includes(role)) {
      return res.status(400).json({ message: 'Invalid role', allowed: EnumUserRole });
    }

    // opțional: prevenim să-ți schimbi singur rolul (ca admin)
    if (req.user?.id === userId) {
      return res.status(400).json({ message: "You can't change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('_id fullName email role');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: 'Role updated',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
};

module.exports = { getAllUsers, updateUserRole };
