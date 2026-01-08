const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Association = require('../models/Association');

exports.getSystemReports = async (req, res) => {
  try {
    // 1. Total evenimente
    const totalEvents = await Event.countDocuments();

    // 2. Total înscrieri
    const totalRegistrations = await Ticket.countDocuments();

    // 3. Rată participare = CHECKED_IN / totalRegistrations
    const checkedInCount = await Ticket.countDocuments({ status: "CHECKED_IN" });

    const attendanceRate =
      totalRegistrations === 0 ? 0 : Math.round((checkedInCount / totalRegistrations) * 100);

    // 4. Top asociații (primele 3)
    // numărăm câte evenimente a organizat fiecare asociație
    const associations = await Event.aggregate([
      { $unwind: "$organizerIds" },
      { $group: { _id: "$organizerIds", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // convertim id-urile în nume
    const topAssociations = [];
    for (const item of associations) {
      const assoc = await Association.findById(item._id);
      if (assoc) topAssociations.push(assoc.name);
    }

    // 5. răspuns final conform Swagger
    res.json({
      totalEvents,
      totalRegistrations,
      attendanceRate,
      topAssociations
    });

  } catch (err) {
    console.error("System reports error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
