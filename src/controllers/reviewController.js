const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Event = require('../models/Event');


/**
 * POST /events/:id/reviews
 * Add a new review to an event
 */
exports.addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const { rating, comment } = req.body;

    // 1. Validate rating field
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // 2. Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 3. Check if user has a ticket -> only participants can review
    const ticket = await Ticket.findOne({ userId, eventId });
    if (!ticket) {
      return res.status(403).json({
        message: "You cannot review an event you have not joined"
      });
    }

    // 4. Create review
    const review = await Review.create({
      eventId,
      userId,
      rating,
      comment
    });

    // 5. Prepare response format
    const user = await User.findById(userId);

    // derive authorTicketStatus based on user's ticket
    const authorTicketStatus = ticket.status || "CONFIRMED";

    const response = {
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      userName: user.fullName,
      createdAt: review.createdAt,
      authorTicketStatus
    };

    res.status(201).json(response);

  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * GET /events/:id/reviews
 * Get all reviews for an event
 */
exports.getReviews = async (req, res) => {
  try {
    const eventId = req.params.id;

    // 1. Fetch reviews
    const reviews = await Review.find({ eventId }).sort({ createdAt: -1 });

    // 2. For each review, return formatted ReviewResponse
    const result = [];

    for (const review of reviews) {
      const user = await User.findById(review.userId);

      // get ticket to know participation status
      const ticket = await Ticket.findOne({
        userId: review.userId,
        eventId
      });

      result.push({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        userName: user.fullName,
        createdAt: review.createdAt,
        authorTicketStatus: ticket?.status || "CONFIRMED"
      });
    }

    res.json(result);

  } catch (err) {
    console.error("Error loading reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
};
