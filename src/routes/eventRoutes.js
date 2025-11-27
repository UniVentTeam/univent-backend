const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEvents,
  getRecommendations,
  getEventDetails,
  updateEvent,
  deleteEvent,
  updateStatus,
  getParticipants,
} = require("../controllers/eventController");
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const { addReview, getReviews } = require("../controllers/reviewController");

router.get("/", auth.optional, getEvents);
router.get("/recommendations", auth.required, getRecommendations);
router.post("/", auth.required, requireRole("ORGANIZER", "ADMIN"), createEvent);
router.get("/:id", auth.optional, getEventDetails);
router.put(
  "/:id",
  auth.required,
  requireRole("ORGANIZER", "ADMIN"),
  updateEvent
);

router.delete(
  "/:id",
  auth.required,
  requireRole("ORGANIZER", "ADMIN"),
  deleteEvent
);

router.patch("/:id/status", auth.required, requireRole("ADMIN"), updateStatus);

router.get(
  "/:id/participants",
  auth.required,
  requireRole("ORGANIZER", "ADMIN"),
  getParticipants
);

router.post("/:id/reviews", auth.required, addReview);

router.get("/:id/reviews", auth.optional, getReviews);

module.exports = router;
