const Event = require('../models/Event');
const Association = require('../models/Association');
const Ticket = require('../models/Ticket'); // pentru isRegistered
const User = require('../models/User');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

exports.getEvents = async (req, res) => {
  try {
    // 1️⃣ Extract query params (EventFilterQuery)
    const {
      page = 1,
      limit = 20,
      search,
      types,
      matchAllTypes = false,
      associationIds,
      organizerTypes,
      locationTypes,
      faculties,
      departments,
      dateFrom,
      dateTo,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    // 2️⃣ Construim filtrul Mongo
    let filter = {};

    // 🔎 Search (title + description)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 🎨 Tipuri de evenimente
    if (types) {
      const typeList = Array.isArray(types) ? types : [types];
      
      filter.type = matchAllTypes
        ? { $all: typeList }
        : { $in: typeList };
    }

    // 🏛 Filtrare după asociații
    if (associationIds) {
      const ids = Array.isArray(associationIds) ? associationIds : [associationIds];
      filter.organizerIds = { $in: ids };
    }

    // 🏷 Filtrare după tipul organizatorului
    if (organizerTypes) {
      const orgTypes = Array.isArray(organizerTypes) ? organizerTypes : [organizerTypes];
      const associations = await Association.find({ type: { $in: orgTypes } }).select('_id');
      filter.organizerIds = { $in: associations.map(a => a._id) };
    }

    // 🌍 Locație
    if (locationTypes) {
      const locTypes = Array.isArray(locationTypes) ? locationTypes : [locationTypes];
      filter.locationType = { $in: locTypes };
    }

    // 🎓 Facultăți (matched with event.faculty)
    if (faculties) {
      const facs = Array.isArray(faculties) ? faculties : [faculties];
      filter.faculty = { $in: facs };
    }

    // 🏫 Departments
    if (departments) {
      const deps = Array.isArray(departments) ? departments : [departments];
      filter.department = { $in: deps };
    }

    // 📅 Date interval
    if (dateFrom || dateTo) {
      filter.startAt = {};
      if (dateFrom) filter.startAt.$gte = new Date(dateFrom);
      if (dateTo) filter.startAt.$lte = new Date(dateTo);
    }

    // ⚙ Status tehnic (Swagger)
    if (status) {
      const st = Array.isArray(status) ? status : [status];
      filter.status = { $in: st };
    }

    // 3️⃣ Obținem evenimentele
    const events = await Event.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organizerIds');

    const userId = req.user ? req.user.id : null;

    // 4️⃣ Transformăm în EventPreview
    const result = [];

    for (const event of events) {

      // 🔥 Calcul publicStatus
      const now = new Date();
      let publicStatus = "UPCOMING";

      if (now >= event.startAt && now <= event.endAt) {
        publicStatus = "ONGOING";
      } else if (now > event.endAt) {
        publicStatus = "ENDED";
      }

      // 🎫 isRegistered
      let isRegistered = false;
      if (userId) {
        const ticket = await Ticket.findOne({
          userId,
          eventId: event._id
        });
        if (ticket) isRegistered = true;
      }

      // 👁️ EventPreview
      result.push({
        id: event._id,
        title: event.title,
        coverImageUrl: event.coverImageUrl,
        startAt: event.startAt,
        endAt: event.endAt,
        locationName: event.locationName,
        status: publicStatus,
        organizers: event.organizerIds.map(org => ({
          id: org._id,
          name: org.name,
          logoUrl: org.logoUrl,
          type: org.type
        })),
        isRegistered
      });
    }

    res.json({
      page: Number(page),
      limit: Number(limit),
      total: result.length,
      events: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.createEvent = async (req, res) => {
    try {
      const user = req.user;
  
      // extragem organizerIds trimis de frontend (dacă există)
      let { organizerIds = [] } = req.body;
  
      // dacă e ORGANIZER → adăugăm automat asociația lui
      if (user.role === "ORGANIZER") {
        const userAssociations = await Association.find({ admins: user.id }).select('_id');
  
        if (userAssociations.length === 0) {
          return res.status(403).json({ message: "You are not admin of any association" });
        }
  
        const mainAssociationId = userAssociations[0]._id.toString();
  
        // adaugăm asociația lui dacă nu e deja în listă
        if (!organizerIds.includes(mainAssociationId)) {
          organizerIds.push(mainAssociationId);
        }
      }
  
      // validare lista finală de organizerIds
      if (organizerIds.length === 0) {
        return res.status(400).json({ message: "No organizer provided" });
      }
  
      // validăm că toate ID-urile trimise există
      const validOrganizers = await Association.find({ _id: { $in: organizerIds } });
      if (validOrganizers.length !== organizerIds.length) {
        return res.status(400).json({ message: "One or more organizerIds are invalid" });
      }
  
      // creăm evenimentul
      const event = await Event.create({
        organizerIds,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        startAt: req.body.startAt,
        endAt: req.body.endAt,
        locationName: req.body.locationName,
        locationType: req.body.locationType,
        coverImageUrl: req.body.coverImageUrl,
        galleryImageUrls: req.body.galleryImageUrls,
        agenda: req.body.agenda,
        status: "PENDING",
        currentParticipants: 0
      });
  
      res.status(201).json(event);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  


exports.getRecommendations = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // 1. Preluăm utilizatorul pentru preferințe
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const preferences = user.preferences || [];
  
      if (preferences.length === 0) {
        return res.json([]); // fără preferințe → zero recomandări
      }
  
      // 2. Evenimente la care userul e deja înscris
      const joinedTickets = await Ticket.find({ userId }).select('eventId');
      const joinedEventIds = joinedTickets.map(t => t.eventId.toString());
  
      // 3. Căutăm evenimente în funcție de tipurile preferate
      const events = await Event.find({
        type: { $in: preferences },
        status: "PUBLISHED",                // doar evenimente publice
        _id: { $nin: joinedEventIds }       // exclude cele vizitate
      })
      .populate('organizerIds')
      .sort({ startAt: 1 });  // ordonate cronologic
  
      // 4. Construim EventPreview conform Swagger
      const result = events.map(ev => ({
        id: ev._id,
        title: ev.title,
        coverImageUrl: ev.coverImageUrl,
        startAt: ev.startAt,
        endAt: ev.endAt,
        locationName: ev.locationName,
        status: ev.status,
  
        organizers: ev.organizerIds.map(o => ({
          id: o._id,
          name: o.name,
          logoUrl: o.logoUrl,
          type: o.type
        })),
  
        isRegistered: false  // pentru că special le excludem pe cele la care e înscris
      }));
  
      return res.json(result);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };




  exports.getEventDetails = async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user?.id; // optional
  
      // 1. Luăm evenimentul
      const event = await Event.findById(eventId)
        .populate('organizerIds')
        .lean();
  
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      // 2. Calculăm isRegistered dacă userul este logat
      let isRegistered = false;
  
      if (userId) {
        const ticket = await Ticket.findOne({ 
          userId: userId, 
          eventId: eventId 
        });
  
        if (ticket) isRegistered = true;
      }
  
      // 3. Construim răspunsul EXACT ca în Swagger
      const response = {
        id: event._id,
        title: event.title,
        coverImageUrl: event.coverImageUrl,
        startAt: event.startAt,
        endAt: event.endAt,
        locationName: event.locationName,
        status: event.status,
  
        organizers: event.organizerIds.map(org => ({
          id: org._id,
          name: org.name,
          logoUrl: org.logoUrl,
          type: org.type
        })),
  
        isRegistered: isRegistered,
        description: event.description,
        type: event.type,
        locationType: event.locationType,
        currentParticipants: event.currentParticipants || 0,
        galleryImageUrls: event.galleryImageUrls || [],
        agenda: event.agenda || []
      };
  
      res.json(response);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };




  exports.updateEvent = async (req, res) => {
    try {
      const eventId = req.params.id;
      const user = req.user;
  
      // 1. Preluăm evenimentul
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      // 2. Verificăm permisiunile
      if (user.role === "ORGANIZER") {
  
        // găsim toate asociațiile unde userul este admin
        const userAssociations = await Association.find({
          admins: user.id
        }).select('_id');
  
        const allowedIds = userAssociations.map(a => a._id.toString());
  
        // dacă niciuna din asociațiile userului nu se află în organizerIds
        const canEdit = event.organizerIds.some(orgId =>
          allowedIds.includes(orgId.toString())
        );
  
        if (!canEdit) {
          return res.status(403).json({ message: "Not allowed to edit this event" });
        }
      }
  
      // 3. Preluăm câmpurile permise
      const allowedFields = [
        "organizerIds",
        "title",
        "description",
        "type",
        "startAt",
        "endAt",
        "locationName",
        "locationType",
        "coverImageUrl",
        "galleryImageUrls",
        "agenda"
      ];
  
      // 4. Actualizăm câmpurile
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });
  
      await event.save();
  
      res.json({
        message: "Event updated successfully",
        event
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };



  exports.deleteEvent = async (req, res) => {
    try {
      const eventId = req.params.id;
      const user = req.user;
  
      // 1️⃣ Căutăm evenimentul
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      // 2️⃣ Dacă userul este ORGANIZER → verificăm permisiuni
      if (user.role === "ORGANIZER") {
        // găsim toate asociațiile unde userul este admin
        const userAssociations = await Association.find({
          admins: user.id
        }).select("_id");
  
        const allowedIds = userAssociations.map(a => a._id.toString());
  
        // vedem dacă event.organizerIds conține una din asociațiile lui
        const canDelete = event.organizerIds.some(orgId =>
          allowedIds.includes(orgId.toString())
        );
  
        if (!canDelete) {
          return res.status(403).json({ message: "Not allowed to delete this event" });
        }
      }
  
      // 3️⃣ Dacă e ADMIN → poate șterge direct
  
      await Event.findByIdAndDelete(eventId);
  
      res.json({ message: "Event deleted successfully" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };




  exports.updateStatus = async (req, res) => {
    try {
      const eventId = req.params.id;
      const { status, rejectionReason } = req.body;
  
      // 1️⃣ Validare minimă
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
  
      // 2️⃣ Luăm evenimentul
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      // 3️⃣ Logica moderării
      if (status === "REJECTED") {
        if (!rejectionReason) {
          return res.status(400).json({
            message: "rejectionReason is required when rejecting an event"
          });
        }
        event.status = "REJECTED";
        event.rejectionReason = rejectionReason;
      }
  
      else if (status === "PUBLISHED") {
        event.status = "PUBLISHED";
        event.rejectionReason = null; // ștergem motivul de respingere
      }
  
      else if (status === "DRAFT") {
        event.status = "DRAFT";
      }
  
      else if (status === "PENDING") {
        event.status = "PENDING";
        event.rejectionReason = null;
      }
  
      else {
        return res.status(400).json({
          message: "Invalid status"
        });
      }
  
      // 4️⃣ Salvăm
      await event.save();
  
      return res.json({
        message: "Status updated",
        event
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
  


  exports.getParticipants = async (req, res) => {
    try {
      const eventId = req.params.id;
      const format = req.query.format || "json";
      const user = req.user;
  
      // 1. găsim evenimentul
      const event = await Event.findById(eventId);
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      // 2. verificăm permisiunea — doar organizerului evenimentului
      // Admin-ul poate vedea oricând
      if (user.role === "ORGANIZER") {
        // găsim o asociație în care userul este admin
        const userAssociation = await Association.findOne({ admins: user.id });
  
        if (!userAssociation) {
          return res.status(403).json({ message: "You are not admin of any association" });
        }
  
        // verificăm că asociația lui este organizatorul evenimentului
        if (!event.organizerIds.some(id => id.toString() === userAssociation._id.toString())) {
          return res.status(403).json({ message: "Not allowed to access participants" });
        }
      }
  
      // 3. luăm toate biletele + userii
      const tickets = await Ticket.find({ eventId }).populate("userId");
  
      // 4. construim lista de participanți conform Swagger
      const participants = tickets.map(t => ({
        id: t.userId._id.toString(),
        email: t.userId.email,
        fullName: t.userId.fullName,
        role: t.userId.role,
        faculty: t.userId.faculty,
        department: t.userId.department,
        preferences: t.userId.preferences || []
      }));
  
      // == JSON ==
      if (format === "json") {
        return res.json(participants);
      }
  
      // == CSV ==
      if (format === "csv") {
        const { Parser } = require("json2csv");
        const parser = new Parser();
        const csv = parser.parse(participants);
  
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=participants.csv`);
        return res.send(csv);
      }
  
      // == PDF ==
      if (format === "pdf") {
        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument();
  
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=participants.pdf`);
        doc.pipe(res);
  
        doc.fontSize(18).text(`Participants for: ${event.title}`, { underline: true });
        doc.moveDown();
  
        participants.forEach(p => {
          doc.fontSize(12).text(
            `${p.fullName} | ${p.email} | ${p.role} | ${p.faculty} | ${p.department}`
          );
        });
  
        doc.end();
        return;
      }
  
      // alt format = eroare
      return res.status(400).json({ message: "Invalid format" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  