const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');

// 🔐 Middleware – autentificare obișnuită (token obligatoriu)
const authRequired = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Missing token' });

  const token = header.split(' ')[1];

  try {
    const decoded = verifyToken(token); 
    req.user = decoded;   // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// 🔓 Middleware – token opțional (pentru GET /events)
const authOptional = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer '))
      return next(); // fără token → public

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch {
    next(); // token invalid → continuă ca user public
  }
};

// Exportăm corect ambele funcții
module.exports = {
  required: authRequired,
  optional: authOptional
};
