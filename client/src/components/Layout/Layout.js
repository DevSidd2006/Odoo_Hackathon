import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Home, 
  Receipt, 
  Users, 
  Settings, 
  LogOut,
  CheckCircle,
  Clock
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { name: 'My Expenses', href: '/expenses', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
    { name: 'Pending Approvals', href: '/approvals', icon: Clock, roles: ['admin', 'manager'] },
    { name: 'All Expenses', href: '/all-expenses', icon: CheckCircle, roles: ['admin', 'manager'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false); // Close mobile sidebar after navigation
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            navigation={filteredNavigation} 
            user={user} 
            onLogout={handleLogout}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={filteredNavigation} 
            user={user} 
            onLogout={handleLogout}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, user, onLogout, currentPath, onNavigate }) => (
  <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <h1 className="text-xl font-bold text-gray-900">Expense Manager</h1>
      </div>
      <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || (currentPath === '/' && item.href === '/dashboard');
          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.href)}
              className={`${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left`}
            >
              <Icon className={`${isActive ? 'text-blue-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div className="flex items-center w-full">
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-700">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs font-medium text-gray-500 capitalize">
            {user?.role} • {user?.company?.name}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="ml-auto flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
);

export default Layout;