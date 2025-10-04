import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to appropriate dashboard based on user role
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'manager') {
    return <ManagerDashboard />;
  }

  // Default to employee dashboard
  return <EmployeeDashboard />;
};

export default Dashboard;
