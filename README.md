# 💼 Enterprise Expense Management System

A comprehensive multi-level expense approval system built with the MERN stack, featuring AI-powered OCR receipt processing, real-time currency conversion, flexible approval workflows, and role-based access control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)
![React](https://img.shields.io/badge/react-v18-blue.svg)
![Supabase](https://img.shields.io/badge/database-supabase-green.svg)

## Features

### 🚀 Core Functionality
- **🔄 Multi-level Approval Workflows**: Define complex approval sequences with percentage-based and specific approver rules
- **📸 AI-Powered OCR**: Auto-extract expense data from receipt images using Google Gemini AI
- **👥 Role-based Access Control**: Admin, Manager, and Employee roles with granular permissions
- **💱 Real-time Currency Conversion**: Multi-currency support with live exchange rates
- **📊 Real-time Status Tracking**: Track expense approval progress with live updates
- **🔒 Enterprise Security**: Session-based auth with Row Level Security (RLS)
- **📱 Responsive Design**: Mobile-first design with Tailwind CSS

### User Roles & Permissions

#### Admin
- Create and manage company settings
- Add/edit users and assign roles
- Configure approval rules and workflows
- View all company expenses
- Override approvals when needed

#### Manager
- Approve/reject team member expenses
- View team expense reports
- Escalate expenses per approval rules
- Manage direct reports

#### Employee
- Submit expense claims with receipts
- Track approval status
- View personal expense history
- Upload receipts for OCR processing

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Hook Form
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Session-based with user ID headers
- **OCR**: Google Gemini AI
- **File Upload**: Multer
- **External APIs**: 
  - RestCountries API for country/currency data
  - ExchangeRate API for real-time currency conversion
  - Google Gemini AI for OCR processing

## Project Structure

```
expense-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
├── server/                 # Node.js backend
│   ├── config/            # Database and service configs
│   ├── middleware/        # Authentication middleware
│   ├── routes/            # API routes
│   └── ...
└── README.md
```

## Setup Instructions

### 📋 Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Supabase account (free tier available)
- Google Gemini API key (free tier available)
- ExchangeRate API key (optional, free tier available)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/expense-management-system.git
cd expense-management-system

# Install dependencies for both client and server
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL commands from `server/config/database.sql` in your Supabase SQL editor
3. Note your Supabase URL and keys

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
# Server environment
cp server/.env.example server/.env
```

Edit `server/.env` with your actual values:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key  # Optional
```

Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### 🔑 Getting API Keys

1. **Supabase**: Create a free account at [supabase.com](https://supabase.com)
2. **Google Gemini**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **ExchangeRate API**: Sign up at [exchangerate-api.com](https://exchangerate-api.com) (optional)

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Backend: npm run server
# Frontend: npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company and admin user
- `POST /api/auth/login` - User login
- `GET /api/auth/countries` - Get countries and currencies

### Users
- `GET /api/users` - Get company users (Admin/Manager)
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:id` - Update user role/manager (Admin)
- `GET /api/users/managers` - Get managers list

### Expenses
- `POST /api/expenses` - Submit new expense
- `GET /api/expenses/my-expenses` - Get user's expenses
- `GET /api/expenses/pending-approvals` - Get pending approvals (Manager/Admin)
- `GET /api/expenses/all` - Get all company expenses (Admin/Manager)

### Approvals
- `POST /api/approvals/:expenseId/decision` - Approve/reject expense
- `POST /api/approvals/rules` - Create approval rule (Admin)
- `GET /api/approvals/rules` - Get approval rules (Admin)

### OCR
- `POST /api/ocr/process-receipt` - Process receipt image with OCR

### Currency
- `GET /api/currency/rate/:from/:to` - Get exchange rate between currencies
- `GET /api/currency/rates/:base` - Get multiple rates for base currency

## Usage Guide

### First Time Setup
1. Register a new account - this creates your company and admin user
2. Select your country and currency during registration
3. Log in and start adding team members

### Adding Users
1. Go to User Management (Admin only)
2. Click "Add User" and fill in details
3. Assign roles and manager relationships
4. Users can now log in with their credentials

### Submitting Expenses
1. Click "Submit Expense" or use the camera icon
2. Upload a receipt image for auto-fill (optional)
3. Fill in expense details
4. Submit for approval

### Approval Process
1. Managers see pending approvals in their dashboard
2. Click "Review" to add comments or use quick approve/reject
3. Expenses move through the approval chain automatically
4. Employees can track status in real-time

### OCR Features
- Upload receipt images (PNG, JPG up to 5MB)
- System automatically extracts:
  - Amount and currency
  - Date and merchant name
  - Expense category
  - Line items
- Manual editing available after OCR processing

## Approval Workflow Types

### Manager Approval
- Default workflow where expenses go to the employee's manager first
- Configurable through the "IS_MANAGER_APPROVER" setting

### Sequential Approval
- Define multiple approvers in sequence
- Example: Manager → Finance → Director
- Each approver must act before moving to the next

### Conditional Approval
- **Percentage Rule**: Expense approved when X% of approvers approve
- **Specific Approver Rule**: Auto-approve when specific person (e.g., CFO) approves
- **Hybrid Rule**: Combine percentage and specific approver rules

## Security Features

- Session-based authentication with user ID verification
- Row Level Security (RLS) in Supabase
- Role-based access control
- Input validation and sanitization
- Secure file upload handling
- Password hashing with bcrypt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository.