const { supabase } = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  try {
    // Get user details from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Authentication failed' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateUser, requireRole };