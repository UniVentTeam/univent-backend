const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    qrContent: { type: String, required: true },
    scannedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CheckIn', checkInSchema);
