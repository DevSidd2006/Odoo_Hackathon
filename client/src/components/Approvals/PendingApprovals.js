import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const PendingApprovals = ({ onApprovalComplete }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await axios.get('/expenses/pending-approvals');
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    }
    setLoading(false);
  };

  const handleApproval = async (expenseId, decision, comments = '') => {
    setProcessingId(expenseId);
    try {
      await axios.post(`/approvals/${expenseId}/decision`, {
        decision,
        comments
      });
      
      toast.success(`Expense ${decision} successfully!`);
      fetchPendingApprovals(); // Refresh the list
      if (onApprovalComplete) {
        onApprovalComplete(); // Notify parent component
      }
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${decision} expense`);
    }
    setProcessingId(null);
  };

  const ApprovalModal = ({ expense, onClose, onSubmit }) => {
    const [decision, setDecision] = useState('');
    const [comments, setComments] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(expense.id, decision, comments);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Review Expense
          </h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900">{expense.description}</p>
            <p className="text-sm text-gray-600">
              {expense.currency} {expense.amount} • {expense.category}
            </p>
            <p className="text-sm text-gray-600">
              Submitted by: {expense.users?.first_name} {expense.users?.last_name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="approved"
                    checked={decision === 'approved'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mr-2"
                  />
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Approve
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="rejected"
                    checked={decision === 'rejected'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mr-2"
                  />
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  Reject
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any comments..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!decision}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Submit Decision
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const [selectedExpense, setSelectedExpense] = useState(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {expenses.length === 0 ? (
          <li className="px-6 py-4 text-center text-gray-500">
            No pending approvals found.
          </li>
        ) : (
          expenses.map((expense) => (
            <li key={expense.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending Review
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <span className="font-medium">
                            {expense.currency} {expense.amount}
                          </span>
                          <span className="mx-2">•</span>
                          {expense.category}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Submitted by: {expense.users?.first_name} {expense.users?.last_name}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setSelectedExpense(expense)}
                    disabled={processingId === expense.id}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Review
                  </button>
                  
                  <button
                    onClick={() => handleApproval(expense.id, 'approved')}
                    disabled={processingId === expense.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {processingId === expense.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Quick Approve
                  </button>
                  
                  <button
                    onClick={() => handleApproval(expense.id, 'rejected')}
                    disabled={processingId === expense.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {selectedExpense && (
        <ApprovalModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onSubmit={handleApproval}
        />
      )}
    </div>
  );
};

export default PendingApprovals;