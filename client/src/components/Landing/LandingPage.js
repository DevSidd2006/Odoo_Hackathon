import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Receipt, 
  CheckCircle, 
  TrendingUp,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

const LandingPage = () => {
  const [activeRole, setActiveRole] = useState('employee');
  const navigate = useNavigate();

  const roles = [
    {
      id: 'employee',
      name: 'Employee',
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      description: 'Submit and track your expense claims',
      features: [
        'Submit expense claims with receipts',
        'OCR auto-fill from receipt images',
        'Track approval status in real-time',
        'View expense history',
        'Multi-currency support'
      ],
      permissions: [
        'Submit expenses',
        'Upload receipts',
        'View own expenses',
        'Track approval status'
      ]
    },
    {
      id: 'manager',
      name: 'Manager',
      icon: UserCheck,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      description: 'Review and approve team expenses',
      features: [
        'Review pending expense approvals',
        'Approve or reject with comments',
        'View team expense reports',
        'Monitor team spending',
        'Sequential approval workflow'
      ],
      permissions: [
        'Approve/reject expenses',
        'View team expenses',
        'Add approval comments',
        'Escalate as per rules'
      ]
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: Shield,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      description: 'Manage users and configure system',
      features: [
        'Create and manage users',
        'Configure approval workflows',
        'Set percentage-based rules',
        'View all company expenses',
        'Override approvals when needed'
      ],
      permissions: [
        'Full system access',
        'User management',
        'Configure approval rules',
        'View all expenses',
        'Override approvals'
      ]
    }
  ];

  const activeRoleData = roles.find(r => r.id === activeRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Receipt className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expense Manager</h1>
                <p className="text-sm text-gray-500">Smart Expense Approval System</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Company Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Role to Get Started
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your expense management with multi-level approvals, OCR receipt scanning, 
            and intelligent workflow automation
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg shadow-md p-1">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
                    ${activeRole === role.id
                      ? `bg-gradient-to-r ${role.gradient} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{role.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Details Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${activeRoleData.gradient} p-8 text-white`}>
            <div className="flex items-center space-x-4 mb-4">
              {React.createElement(activeRoleData.icon, { className: 'h-12 w-12' })}
              <div>
                <h3 className="text-3xl font-bold">{activeRoleData.name}</h3>
                <p className="text-blue-100">{activeRoleData.description}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Features */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Key Features
                </h4>
                <ul className="space-y-3">
                  {activeRoleData.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Permissions & Access
                </h4>
                <ul className="space-y-3">
                  {activeRoleData.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start">
                      <div className={`h-2 w-2 rounded-full bg-${activeRoleData.color}-500 mr-3 mt-2`}></div>
                      <span className="text-gray-700">{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Login Button */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => navigate('/login')}
                className={`w-full bg-gradient-to-r ${activeRoleData.gradient} text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all transform hover:scale-105`}
              >
                Login as {activeRoleData.name}
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Don't have an account? 
                <button
                  onClick={() => navigate('/register')}
                  className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                >
                  Create one now
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* System Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Level Approvals</h3>
            <p className="text-gray-600">
              Sequential, percentage-based, or hybrid approval workflows
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">OCR Receipt Scanning</h3>
            <p className="text-gray-600">
              Auto-extract expense details from receipt images
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Currency Support</h3>
            <p className="text-gray-600">
              Automatic currency conversion to company base currency
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2025 Expense Manager. All rights reserved.</p>
            <p className="mt-2">Streamline your expense approval process with intelligent automation</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;