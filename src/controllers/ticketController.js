const Ticket = require('../models/Ticket');
const Event = require('../models/Event');


// POST /tickets
exports.joinEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    // 1. Check event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 2. Check event is published
    if (event.status !== "PUBLISHED") {
      return res.status(409).json({ message: "Event is not published yet" });
    }

    // 3. Check if already registered
    const existingTicket = await Ticket.findOne({ userId, eventId });
    if (existingTicket)
      return res.status(409).json({ message: "User already registered for this event" });

    // 4. Create empty ticket first
    const ticket = await Ticket.create({
      eventId,
      userId,
      eventTitle: event.title,
      eventStartAt: event.startAt,
      qrCodeContent: "", // îl completăm după creare
      status: "CONFIRMED"
    });

    // 5. Generate QR containing TICKET ID, not userId
    ticket.qrCodeContent = `TICKET-${eventId}-${ticket._id.toString()}-${Date.now()}`;
    await ticket.save();

    // 6. Increment event participants
    event.currentParticipants += 1;
    await event.save();

    return res.status(201).json({
      id: ticket._id,
      eventTitle: ticket.eventTitle,
      eventStartAt: ticket.eventStartAt,
      qrCodeContent: ticket.qrCodeContent,
      status: ticket.status
    });

  } catch (err) {
    console.error("Error joining event:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await Ticket.find({ userId }).lean();

    const result = tickets.map(t => ({
      id: t._id,
      eventId: t.eventId,          // 🔥 ADAUGAT
      eventTitle: t.eventTitle,
      eventStartAt: t.eventStartAt,
      qrCodeContent: t.qrCodeContent,
      status: t.status
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



  exports.getTicketById = async (req, res) => {
    try {
      const ticketId = req.params.id;
      const userId = req.user.id;
  
      const ticket = await Ticket.findOne({ _id: ticketId, userId }).lean();
  
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
  
      const result = {
        id: ticket._id,
        eventTitle: ticket.eventTitle,
        eventStartAt: ticket.eventStartAt,
        qrCodeContent: ticket.qrCodeContent,
        status: ticket.status
      };
  
      res.json(result);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  