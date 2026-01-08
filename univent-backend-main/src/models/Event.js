const mongoose = require('mongoose');
const EnumEventType = require('./enums/eventType.enum');
const EnumLocationType = require('./enums/locationType.enum');
const EnumEventStatus = require('./enums/eventStatus.enum');

const agendaItemSchema = new mongoose.Schema({
  time: String,
  title: String,
  description: String,
  speakers: [String]
}, { _id: false });

const eventSchema = new mongoose.Schema({
  organizerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Association',
    required: true
  }],

  rejectionReason: { type: String, default: null },

  title: { type: String, required: true },
  description: String,

  // Relaxed validation for DRAFT status
  type: { type: String, enum: EnumEventType },

  startAt: { type: Date },
  endAt: { type: Date },

  locationName: { type: String },
  locationType: { type: String, enum: EnumLocationType },

  maxParticipants: { type: Number }, // Added field

  coverImageUrl: String,
  galleryImageUrls: [String],
  agenda: [agendaItemSchema],

  status: { type: String, enum: EnumEventStatus, default: "PENDING" },

  currentParticipants: { type: Number, default: 0 }

});


module.exports = mongoose.model('Event', eventSchema);
