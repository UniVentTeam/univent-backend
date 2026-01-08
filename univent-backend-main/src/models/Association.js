const mongoose = require('mongoose');
const EnumOrganizerType = require('./enums/organizerType.enum');

const socialLinksSchema = new mongoose.Schema({
  website: String,
  instagram: String,
  facebook: String,
  linkedin: String
}, { _id: false });

const associationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: String,
  type: { type: String, enum: EnumOrganizerType, required: true },
  description: String,
  contactEmail: String,
  socialLinks: socialLinksSchema,

  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
  
});

module.exports = mongoose.model('Association', associationSchema);
