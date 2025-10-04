const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { supabase } = require('../config/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { uploadReceipt, deleteReceipt } = require('../utils/storage');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// Get currency conversion rate
const getCurrencyRate = async (fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) return 1;

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`
      : `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

    const response = await axios.get(baseUrl);
    const rates = apiKey ? response.data.conversion_rates : response.data.rates;
    return rates[toCurrency] || 1;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return 1;
  }
};

// Submit expense with receipt upload (Employee)
router.post('/', authenticateUser, upload.single('receipt'), async (req, res) => {
  try {
    const { amount, currency, category, description, merchant, expenseDate, items } = req.body;
    let receiptUrl = null;
    let receiptFileName = null;
    let receiptFileSize = null;

    // Upload receipt if provided
    if (req.file) {
      try {
        const uploadResult = await uploadReceipt(
          req.file.buffer,
          req.file.originalname,
          req.user.id,
          req.file.mimetype
        );
        receiptUrl = uploadResult.url;
        receiptFileName = uploadResult.fileName;
        receiptFileSize = uploadResult.size;
      } catch (uploadError) {
        console.error('Receipt upload error:', uploadError);
        // Continue without receipt if upload fails
      }
    }

    // Get company currency for conversion
    const companyCurrency = req.user.companies.currency;
    const conversionRate = await getCurrencyRate(currency, companyCurrency);
    const amountInCompanyCurrency = amount * conversionRate;

    // Get approval rule (for now, use default manager approval)
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        employee_id: req.user.id,
        company_id: req.user.company_id,
        amount,
        currency,
        amount_in_company_currency: amountInCompanyCurrency,
        exchange_rate: conversionRate,
        category,
        description,
        merchant,
        expense_date: expenseDate,
        receipt_url: receiptUrl,
        receipt_file_name: receiptFileName,
        receipt_file_size: receiptFileSize,
        current_approver_id: req.user.manager_id,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Expense creation error:', error);
      return res.status(400).json({ error: 'Failed to submit expense' });
    }

    // Insert line items if provided
    if (items && items.length > 0) {
      const lineItems = items.map(item => ({
        expense_id: expense.id,
        name: item.name,
        amount: parseFloat(item.amount)
      }));

      const { error: itemsError } = await supabase
        .from('expense_items')
        .insert(lineItems);

      if (itemsError) {
        console.error('Line items error:', itemsError);
        // Don't fail the whole request, just log the error
      }
    }

    // Create approval record for manager if exists
    if (req.user.manager_id) {
      await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expense.id,
          approver_id: req.user.manager_id,
          sequence_order: 1
        });
    }

    res.status(201).json({
      message: 'Expense submitted successfully',
      expense
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's expenses
router.get('/my-expenses', authenticateUser, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_items(
          id,
          name,
          amount
        ),
        expense_approvals(
          id,
          status,
          comments,
          approved_at,
          users(first_name, last_name)
        )
      `)
      .eq('employee_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch expenses' });
    }

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expenses for approval (Manager/Admin)
router.get('/pending-approvals', authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_employee_id_fkey(first_name, last_name, email),
        expense_items(
          id,
          name,
          amount
        ),
        expense_approvals!inner(
          id,
          status,
          sequence_order
        )
      `)
      .eq('company_id', req.user.company_id)
      .eq('expense_approvals.approver_id', req.user.id)
      .eq('expense_approvals.status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch pending approvals' });
    }

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all expenses (Admin/Manager)
router.get('/all', authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_employee_id_fkey(first_name, last_name, email),
        expense_items(
          id,
          name,
          amount
        ),
        expense_approvals(
          id,
          status,
          comments,
          approved_at,
          users(first_name, last_name)
        )
      `)
      .eq('company_id', req.user.company_id);

    // If manager, only show team expenses
    if (req.user.role === 'manager') {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .eq('manager_id', req.user.id);

      const teamIds = teamMembers.map(member => member.id);
      query = query.in('employee_id', teamIds);
    }

    const { data: expenses, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch expenses' });
    }

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;