module.exports = (...allowedRoles) => {
    return (req, res, next) => {
      try {
        const user = req.user; // vine din authMiddleware
  
        if (!user) {
          return res.status(401).json({ message: "Not authenticated" });
        }
  
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
  
        next(); // user are rol permis
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    };
  };
  