const express = require('express');
const axios = require('axios');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get exchange rate between currencies
router.get('/rate/:from/:to', authenticateUser, async (req, res) => {
  try {
    const { from, to } = req.params;
    
    if (from === to) {
      return res.json({ rate: 1, from, to });
    }

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseUrl = apiKey 
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`
      : `https://api.exchangerate-api.com/v4/latest/${from}`;
    
    const response = await axios.get(baseUrl);
    const rates = apiKey ? response.data.conversion_rates : response.data.rates;
    const rate = rates[to];
    
    if (!rate) {
      return res.status(400).json({ error: 'Currency not supported' });
    }

    res.json({
      rate,
      from,
      to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Currency rate error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

// Get multiple rates for a base currency
router.get('/rates/:base', authenticateUser, async (req, res) => {
  try {
    const { base } = req.params;
    const { currencies } = req.query; // comma-separated list
    
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseUrl = apiKey 
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
      : `https://api.exchangerate-api.com/v4/latest/${base}`;
    
    const response = await axios.get(baseUrl);
    const allRates = apiKey ? response.data.conversion_rates : response.data.rates;
    
    let rates = allRates;
    if (currencies) {
      const requestedCurrencies = currencies.split(',');
      rates = {};
      requestedCurrencies.forEach(currency => {
        if (allRates[currency]) {
          rates[currency] = allRates[currency];
        }
      });
    }

    res.json({
      base,
      rates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Currency rates error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;