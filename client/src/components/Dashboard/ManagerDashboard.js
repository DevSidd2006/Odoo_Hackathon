import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PendingApprovals from '../Approvals/PendingApprovals';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedToday: 0,
    teamExpenses: 0,
    totalAmount: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch pending approvals
      const approvalsResponse = await axios.get('/expenses/pending-approvals');
      const pendingApprovals = approvalsResponse.data;

      // Fetch all team expenses
      const expensesResponse = await axios.get('/expenses/all');
      const allExpenses = expensesResponse.data;

      // Calculate stats
      const today = new Date().toDateString();
      const approvedToday = allExpenses.filter(exp => 
        exp.status === 'approved' && 
        new Date(exp.updated_at).toDateString() === today
      ).length;

      const totalAmount = allExpenses.reduce((sum, exp) => 
        sum + (exp.amount_in_company_currency || exp.amount), 0
      );

      setStats({
        pendingApprovals: pendingApprovals.length,
        approvedToday,
        teamExpenses: allExpenses.length,
        totalAmount
      });

      // Get unique team members
      const uniqueMembers = [...new Map(
        allExpenses.map(exp => [exp.users?.id, exp.users])
      ).values()].filter(Boolean);
      
      setTeamMembers(uniqueMembers);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
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
              {subtitle && (
                <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard 📊</h1>
            <p className="mt-2 text-lg text-gray-600">
              Review and approve team expense claims
            </p>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
            👔 Manager Dashboard
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertCircle}
          color="bg-orange-500"
          bgColor="bg-white"
          subtitle="Requires your attention"
        />
        <StatCard
          title="Approved Today"
          value={stats.approvedToday}
          icon={CheckCircle}
          color="bg-green-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Team Expenses"
          value={stats.teamExpenses}
          icon={TrendingUp}
          color="bg-blue-500"
          bgColor="bg-white"
          subtitle="Total submissions"
        />
        <StatCard
          title="Total Amount"
          value={`${user?.company?.currency} ${stats.totalAmount.toFixed(2)}`}
          icon={DollarSign}
          color="bg-purple-500"
          bgColor="bg-white"
        />
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          </div>
          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No team members found</p>
            ) : (
              teamMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 shadow rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Quick Actions</h3>
          <p className="text-blue-100 mb-4">
            {stats.pendingApprovals > 0 
              ? `You have ${stats.pendingApprovals} expense${stats.pendingApprovals > 1 ? 's' : ''} waiting for your approval`
              : 'All caught up! No pending approvals at the moment.'}
          </p>
          <div className="flex space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 flex-1">
              <Clock className="h-6 w-6 mb-2" />
              <p className="text-sm font-medium">Review Pending</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 flex-1">
              <CheckCircle className="h-6 w-6 mb-2" />
              <p className="text-sm font-medium">Approved Today</p>
              <p className="text-2xl font-bold">{stats.approvedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
        </div>
        <div className="p-6">
          <PendingApprovals onApprovalComplete={fetchDashboardData} />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;