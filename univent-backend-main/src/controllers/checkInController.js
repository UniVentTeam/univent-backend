const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Event = require('../models/Event');
const Association = require('../models/Association'); // 🔥 MUST HAVE

exports.scan = async (req, res) => {
  try {
    const { qrContent, eventId } = req.body;
    const user = req.user;

    if (!qrContent || !eventId) {
      return res.status(400).json({
        valid: false,
        message: "Missing qrContent or eventId"
      });
    }

    // 🔥 extractăm info din QR
    const parts = qrContent.split("-");

    if (parts.length < 4 || parts[0] !== "TICKET") {
      return res.status(200).json({
        valid: false,
        message: "Invalid QR code format"
      });
    }

    const scannedEventId = parts[1];
    const ticketId = parts[2];

    // 1️⃣ evenimentul trebuie să fie același cu cel scanat
    if (scannedEventId !== eventId) {
      return res.status(200).json({
        valid: false,
        message: "QR does not belong to this event"
      });
    }

    // 2️⃣ verificăm că event-ul există
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(200).json({
        valid: false,
        message: "Event not found"
      });
    }

    // 3️⃣ găsim ticket-ul după ID-ul real
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(200).json({
        valid: false,
        message: "Ticket not found"
      });
    }

    // 4️⃣ verificăm că biletul chiar aparține acestui event
    if (ticket.eventId.toString() !== eventId) {
      return res.status(200).json({
        valid: false,
        message: "Ticket does not belong to this event"
      });
    }

    // 5️⃣ doar organizatorul eventului poate face check-in
    if (user.role === "ORGANIZER") {
      const assoc = await Association.findOne({ admins: user.id });

      const eventOrgIds = event.organizerIds.map(id => id.toString());

      if (!assoc || !eventOrgIds.includes(assoc._id.toString())) {
        return res.status(403).json({
          valid: false,
          message: "Not allowed to perform check-in"
        });
      }
    }

    // 6️⃣ verificăm dacă e deja scanat
    if (ticket.status === "CHECKED_IN") {
      const student = await User.findById(ticket.userId);
      return res.status(200).json({
        valid: false,
        message: "Ticket already checked in",
        studentName: student?.fullName || null
      });
    }

    // 7️⃣ marcăm check-in
    ticket.status = "CHECKED_IN";
    await ticket.save();

    const student = await User.findById(ticket.userId);

    return res.status(200).json({
      valid: true,
      message: "Check-in successful",
      studentName: student.fullName
    });

  } catch (err) {
    console.error("Check-in error:", err);
    return res.status(500).json({
      valid: false,
      message: "Server error"
    });
  }
};
