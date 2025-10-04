import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/Landing/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ExpenseList from './components/Expenses/ExpenseList';
import PendingApprovals from './components/Approvals/PendingApprovals';
import UserManagement from './components/Users/UserManagement';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<PublicRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<ProtectedRoute />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function PublicRoute() {
  const { user } = useAuth();
  
  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  // Otherwise show landing page
  return <LandingPage />;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/approvals" element={<ApprovalsPage user={user} />} />
        <Route path="/all-expenses" element={<AllExpensesPage user={user} />} />
        <Route path="/users" element={<UsersPage user={user} />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

// Page Components
function ExpensesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your expense submissions
        </p>
      </div>
      <ExpenseList />
    </div>
  );
}

function ApprovalsPage({ user }) {
  if (user?.role === 'employee') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve expense claims from your team
        </p>
      </div>
      <PendingApprovals />
    </div>
  );
}

function AllExpensesPage({ user }) {
  if (user?.role === 'employee') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete overview of all company expenses
        </p>
      </div>
      <AllExpensesList />
    </div>
  );
}

function AllExpensesList() {
  const [expenses, setExpenses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchAllExpenses();
  }, []);

  const fetchAllExpenses = async () => {
    try {
      const response = await axios.get('/expenses/all');
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
    setLoading(false);
  };

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
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {expenses.length === 0 ? (
          <li className="px-6 py-4 text-center text-gray-500">
            No expenses found.
          </li>
        ) : (
          expenses.map((expense) => (
            <li key={expense.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
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
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                          {expense.currency} {expense.amount}
                        </span>
                        <span className="mx-2">•</span>
                        {expense.category}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        By: {expense.users?.first_name} {expense.users?.last_name}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>{new Date(expense.expense_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function UsersPage({ user }) {
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage company users and their roles
        </p>
      </div>
      <UserManagement />
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and company settings
        </p>
      </div>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Settings Coming Soon
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Settings page is under development. You'll be able to manage:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Company information</li>
              <li>Approval rules and workflows</li>
              <li>Expense categories</li>
              <li>Notification preferences</li>
              <li>Integration settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;