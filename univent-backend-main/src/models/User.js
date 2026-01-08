const mongoose = require('mongoose');
const EnumUserRole = require('./enums/userRole.enum');
const EnumEventType = require('./enums/eventType.enum');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  password: { type: String, required: true },  // backend only
  role: { type: String, enum: EnumUserRole, required: true },
  faculty: { type: String },
  department: { type: String },
  preferences: [{
    type: String,
    enum: EnumEventType
  }]
});

module.exports = mongoose.model('User', userSchema);
