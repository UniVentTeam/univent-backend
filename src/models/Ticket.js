const mongoose = require('mongoose');
const EnumTicketStatus = require('./enums/ticketStatus.enum');

const ticketSchema = new mongoose.Schema({
  eventTitle: String,
  eventStartAt: Date,
  qrCodeContent: String,
  status: { type: String, enum: EnumTicketStatus },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }
});

module.exports = mongoose.model('Ticket', ticketSchema);
