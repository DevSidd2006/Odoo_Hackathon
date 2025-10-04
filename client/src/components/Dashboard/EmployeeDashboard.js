import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import ExpenseForm from '../Expenses/ExpenseForm';
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Plus
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    totalAmount: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/expenses/my-expenses');
      const expenses = response.data;
      
      const stats = expenses.reduce((acc, expense) => {
        acc.totalExpenses++;
        acc.totalAmount += expense.amount_in_company_currency || expense.amount;
        
        switch (expense.status) {
          case 'pending':
            acc.pendingExpenses++;
            break;
          case 'approved':
            acc.approvedExpenses++;
            break;
          case 'rejected':
            acc.rejectedExpenses++;
            break;
          default:
            break;
        }
        
        return acc;
      }, {
        totalExpenses: 0,
        pendingExpenses: 0,
        approvedExpenses: 0,
        rejectedExpenses: 0,
        totalAmount: 0
      });
      
      setStats(stats);
      setRecentExpenses(expenses.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className={`${bgColor} overflow-hidden shadow rounded-lg`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} p-3 rounded-md`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}! 👋</h1>
            <p className="mt-2 text-lg text-gray-600">
              Track and manage your expense claims
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
            👤 Employee Dashboard
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <button
          onClick={() => setShowExpenseForm(true)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Submit New Expense
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={Receipt}
          color="bg-blue-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingExpenses}
          icon={Clock}
          color="bg-yellow-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Approved"
          value={stats.approvedExpenses}
          icon={CheckCircle}
          color="bg-green-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Total Amount"
          value={`${user?.company?.currency} ${stats.totalAmount.toFixed(2)}`}
          icon={DollarSign}
          color="bg-purple-500"
          bgColor="bg-white"
        />
      </div>

      {/* Recent Expenses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentExpenses.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No expenses yet. Submit your first expense to get started!</p>
            </div>
          ) : (
            recentExpenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(expense.status)}`}>
                        {expense.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="font-medium text-gray-900 mr-2">
                        {expense.currency} {expense.amount}
                      </span>
                      <span>•</span>
                      <span className="ml-2">{expense.category}</span>
                      <span className="ml-2">•</span>
                      <span className="ml-2">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSuccess={() => {
            setShowExpenseForm(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;