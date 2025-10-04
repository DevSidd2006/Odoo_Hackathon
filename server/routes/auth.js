const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Get countries and currencies
router.get('/countries', async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    const countries = response.data.map(country => ({
      name: country.name.common,
      currencies: country.currencies
    }));
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Register/Login (creates company on first signup)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, country, currency } = req.body;

    console.log('Registration attempt:', { email, companyName, country, currency });

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Database error checking user' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create company first
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        currency: currency || 'INR',
        country: country || 'India'
      })
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return res.status(400).json({ 
        error: 'Failed to create company', 
        details: companyError.message 
      });
    }

    console.log('Company created:', company.id);

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        company_id: company.id
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Try to clean up the company if user creation fails
      await supabase.from('companies').delete().eq('id', company.id);
      return res.status(400).json({ 
        error: 'Failed to create user', 
        details: userError.message 
      });
    }

    console.log('User created:', user.id);

    res.status(201).json({
      message: 'Company and admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: company.id,
        company: company
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      details: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with company details
    const { data: user, error } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        company: user.companies
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;