import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const ExpenseList = ({ onRefresh }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExpense, setExpandedExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/expenses/my-expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

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
            No expenses found. Submit your first expense!
          </li>
        ) : (
          expenses.map((expense) => (
            <li key={expense.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {getStatusIcon(expense.status)}
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </p>
                        <button
                          onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          {expandedExpense === expense.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        {expense.category} • {expense.merchant && `${expense.merchant} • `}
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </p>
                      {expense.amount_in_company_currency && expense.currency !== 'USD' && (
                        <p className="text-xs text-gray-500">
                          ≈ USD {expense.amount_in_company_currency.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedExpense === expense.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4 space-y-4">
                    {/* Line Items */}
                    {expense.expense_items && expense.expense_items.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Expense Items</h4>
                        <div className="bg-gray-50 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {expense.expense_items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                    {expense.currency} {parseFloat(item.amount).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 font-medium">
                                <td className="px-4 py-2 text-sm text-gray-900">Total</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                  {expense.currency} {expense.amount.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Approval History */}
                    {expense.expense_approvals && expense.expense_approvals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Approval History</h4>
                        <div className="space-y-2">
                          {expense.expense_approvals.map((approval) => (
                            <div key={approval.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
                              <div className="flex items-center">
                                {getStatusIcon(approval.status)}
                                <span className="ml-2 text-gray-600">
                                  {approval.users?.first_name} {approval.users?.last_name}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(approval.status)}`}>
                                  {approval.status}
                                </span>
                                {approval.approved_at && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(approval.approved_at).toLocaleDateString()}
                                  </p>
                                )}
                                {approval.comments && (
                                  <p className="text-xs text-gray-600 mt-1 italic">"{approval.comments}"</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ExpenseList;