const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users in company (Admin/Manager only)
router.get('/', authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, manager_id, created_at')
      .eq('company_id', req.user.company_id)
      .eq('is_active', true);

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch users' });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (Admin only)
router.post('/', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, managerId } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        company_id: req.user.company_id,
        manager_id: managerId || null
      })
      .select('id, email, first_name, last_name, role, manager_id, created_at')
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role/manager (Admin only)
router.put('/:userId', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, managerId } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        role,
        manager_id: managerId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('company_id', req.user.company_id)
      .select('id, email, first_name, last_name, role, manager_id')
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to update user' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get managers for dropdown
router.get('/managers', authenticateUser, async (req, res) => {
  try {
    const { data: managers, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('company_id', req.user.company_id)
      .in('role', ['admin', 'manager'])
      .eq('is_active', true);

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch managers' });
    }

    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;