import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Receipt, 
  CheckCircle, 
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Building,
  BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    totalAmount: 0,
    thisMonthAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all users
      const usersResponse = await axios.get('/users');
      const users = usersResponse.data;

      // Fetch all expenses
      const expensesResponse = await axios.get('/expenses/all');
      const expenses = expensesResponse.data;

      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const stats = expenses.reduce((acc, expense) => {
        acc.totalExpenses++;
        const amount = expense.amount_in_company_currency || expense.amount;
        acc.totalAmount += amount;

        const expenseDate = new Date(expense.created_at);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
          acc.thisMonthAmount += amount;
        }

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
        totalUsers: users.length,
        totalExpenses: 0,
        pendingExpenses: 0,
        approvedExpenses: 0,
        rejectedExpenses: 0,
        totalAmount: 0,
        thisMonthAmount: 0
      });

      setStats(stats);
      setRecentActivity(expenses.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle, trend }) => (
    <div className={`${bgColor} overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} p-3 rounded-md`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {trend && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {trend}
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', icon: Receipt };
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard 🎯</h1>
            <p className="mt-2 text-lg text-gray-600">
              Complete overview of {user?.company?.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold">
              🛡️ Admin Dashboard
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-2">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm font-semibold text-gray-900">{user?.company?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-blue-500"
          bgColor="bg-white"
          subtitle="Active employees"
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={Receipt}
          color="bg-purple-500"
          bgColor="bg-white"
          subtitle="All time"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingExpenses}
          icon={Clock}
          color="bg-yellow-500"
          bgColor="bg-white"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Total Amount"
          value={`${user?.company?.currency} ${stats.totalAmount.toFixed(2)}`}
          icon={DollarSign}
          color="bg-green-500"
          bgColor="bg-white"
          subtitle="All expenses"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 shadow rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Approved Expenses</p>
              <p className="text-3xl font-bold mt-2">{stats.approvedExpenses}</p>
              <p className="text-green-100 text-xs mt-1">
                {stats.totalExpenses > 0 
                  ? `${((stats.approvedExpenses / stats.totalExpenses) * 100).toFixed(1)}% approval rate`
                  : 'No expenses yet'}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-white opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 shadow rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Rejected Expenses</p>
              <p className="text-3xl font-bold mt-2">{stats.rejectedExpenses}</p>
              <p className="text-red-100 text-xs mt-1">
                {stats.totalExpenses > 0 
                  ? `${((stats.rejectedExpenses / stats.totalExpenses) * 100).toFixed(1)}% rejection rate`
                  : 'No expenses yet'}
              </p>
            </div>
            <XCircle className="h-12 w-12 text-white opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">This Month</p>
              <p className="text-3xl font-bold mt-2">
                {user?.company?.currency} {stats.thisMonthAmount.toFixed(2)}
              </p>
              <p className="text-blue-100 text-xs mt-1">Current month spending</p>
            </div>
            <BarChart3 className="h-12 w-12 text-white opacity-80" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.map((expense) => {
              const statusInfo = getStatusBadge(expense.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <StatusIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {expense.description}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusInfo.color}`}>
                            {expense.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="font-medium text-gray-700">
                            {expense.users?.first_name} {expense.users?.last_name}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="font-medium text-gray-900">
                            {expense.currency} {expense.amount}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{expense.category}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {new Date(expense.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;