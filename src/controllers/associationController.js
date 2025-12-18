const Association = require('../models/Association');


exports.create = async (req, res) => {
  try {
    const {
      name,
      logoUrl,
      type,
      description,
      contactEmail,
      socialLinks
    } = req.body;

    // validare minimă
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    // userul logat devine admin al asociației
    const adminId = req.user.id;

    const assoc = await Association.create({
      name,
      logoUrl,
      type,
      description,
      contactEmail,
      socialLinks,
      admins: [adminId]   // 🔥 MULTI-admin support
    });

    res.status(201).json({
      id: assoc._id,
      name: assoc.name,
      logoUrl: assoc.logoUrl,
      type: assoc.type,
      description: assoc.description,
      contactEmail: assoc.contactEmail,
      socialLinks: assoc.socialLinks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// GET /associations  → AssociationSimple[]
exports.getAll = async (req, res) => {
  try {
    const associations = await Association.find();

    const result = associations.map(a => ({
      id: a._id,
      name: a.name,
      logoUrl: a.logoUrl,
      type: a.type
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// GET /associations/:id → AssociationDetail
exports.getOne = async (req, res) => {
  try {
    const assoc = await Association.findById(req.params.id);

    if (!assoc)
      return res.status(404).json({ message: "Association not found" });

    const result = {
      id: assoc._id,
      name: assoc.name,
      logoUrl: assoc.logoUrl,
      type: assoc.type,
      description: assoc.description,
      contactEmail: assoc.contactEmail,
      socialLinks: assoc.socialLinks
    };

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /associations/mine
exports.getMine = async (req, res) => {
  try {
    const userId = req.user.id;
    // find all associations where admins contains userId
    const associations = await Association.find({ admins: userId });

    const result = associations.map(a => ({
      id: a._id,
      name: a.name,
      logoUrl: a.logoUrl,
      type: a.type
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
