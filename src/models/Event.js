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

  type: { type: String, enum: EnumEventType, required: true },

  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },

  locationName: { type: String, required: true },
  locationType: { type: String, enum: EnumLocationType },

  coverImageUrl: String,
  galleryImageUrls: [String],
  agenda: [agendaItemSchema],

  status: { type: String, enum: EnumEventStatus, default: "PENDING" },

  currentParticipants: { type: Number, default: 0 }

  

});


module.exports = mongoose.model('Event', eventSchema);
