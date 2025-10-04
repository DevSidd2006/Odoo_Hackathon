const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');

const router = express.Router();

// Approve/Reject expense
router.post('/:expenseId/decision', authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { decision, comments } = req.body; // 'approved' or 'rejected'

    // Get the expense and current approval
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*, expense_approvals(*)')
      .eq('id', expenseId)
      .single();

    if (expenseError || !expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Find current approval record
    const currentApproval = expense.expense_approvals.find(
      approval => approval.approver_id === req.user.id && approval.status === 'pending'
    );

    if (!currentApproval) {
      return res.status(403).json({ error: 'Not authorized to approve this expense' });
    }

    // Update approval record
    const { error: approvalError } = await supabase
      .from('expense_approvals')
      .update({
        status: decision,
        comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', currentApproval.id);

    if (approvalError) {
      return res.status(400).json({ error: 'Failed to update approval' });
    }

    // Check if this was the final approval or if rejected
    if (decision === 'rejected') {
      // Reject the entire expense
      await supabase
        .from('expenses')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);
    } else {
      // Check if there are more approvals needed
      const { data: pendingApprovals } = await supabase
        .from('expense_approvals')
        .select('id')
        .eq('expense_id', expenseId)
        .eq('status', 'pending');

      if (pendingApprovals.length === 0) {
        // All approvals complete - approve expense
        await supabase
          .from('expenses')
          .update({
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId);
      } else {
        // Move to next approver
        const nextApproval = pendingApprovals[0];
        const { data: nextApprover } = await supabase
          .from('expense_approvals')
          .select('approver_id')
          .eq('id', nextApproval.id)
          .single();

        await supabase
          .from('expenses')
          .update({
            current_approver_id: nextApprover.approver_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId);
      }
    }

    res.json({
      message: `Expense ${decision} successfully`,
      decision,
      comments
    });
  } catch (error) {
    console.error('Approval decision error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create approval rule (Admin only)
router.post('/rules', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { name, ruleType, percentageThreshold, specificApproverId, isManagerApprover, approvers } = req.body;

    // Create approval rule
    const { data: rule, error: ruleError } = await supabase
      .from('approval_rules')
      .insert({
        company_id: req.user.company_id,
        name,
        rule_type: ruleType,
        percentage_threshold: percentageThreshold,
        specific_approver_id: specificApproverId,
        is_manager_approver: isManagerApprover
      })
      .select()
      .single();

    if (ruleError) {
      return res.status(400).json({ error: 'Failed to create approval rule' });
    }

    // Create approval sequences if provided
    if (approvers && approvers.length > 0) {
      const sequences = approvers.map((approverId, index) => ({
        rule_id: rule.id,
        approver_id: approverId,
        sequence_order: index + 1
      }));

      const { error: sequenceError } = await supabase
        .from('approval_sequences')
        .insert(sequences);

      if (sequenceError) {
        console.error('Failed to create approval sequences:', sequenceError);
      }
    }

    res.status(201).json({
      message: 'Approval rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get approval rules (Admin only)
router.get('/rules', authenticateUser, requireRole(['admin']), async (req, res) => {
  try {
    const { data: rules, error } = await supabase
      .from('approval_rules')
      .select(`
        *,
        approval_sequences(
          id,
          sequence_order,
          users(id, first_name, last_name, email)
        )
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch approval rules' });
    }

    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;