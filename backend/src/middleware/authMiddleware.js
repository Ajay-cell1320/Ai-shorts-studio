const { verifyToken } = require('../services/authService');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ ok: false, error: 'Unauthorized: Valid token required' });
  }

  req.user = decoded;
  next();
}

module.exports = { requireAuth };
