// backend/middleware/simpleAuth.js
const jwt = require('jsonwebtoken');

// Simple JWT-only verification
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔐 Simple JWT verification:');
    console.log('   Token preview:', token.substring(0, 30) + '...');

    // Only handle JWT tokens
    if (token.startsWith('eyJ') && token.split('.').length === 3) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
        console.log('✅ JWT token verified for user:', decoded.userId);
        
        // Set req.user directly from JWT payload
        req.user = { 
          uid: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          collection: decoded.collection || 'users'
        };
        
        console.log('✅ User set in request:', req.user.role);
        return next();
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError.message);
        return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
      }
    } else {
      console.error('❌ Not a JWT token');
      return res.status(401).json({ error: 'Invalid token format' });
    }

  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin
};