-- ============================================
-- EXPENSE MANAGEMENT SYSTEM - FRESH DATABASE SETUP
-- ============================================
-- This script will DROP all existing tables and create fresh ones
-- WARNING: This will delete all existing data!
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS expense_approvals CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS approval_sequences CASCADE;
DROP TABLE IF EXISTS approval_rules CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop any existing storage buckets (run this in Supabase Dashboard → Storage)
-- DELETE FROM storage.buckets WHERE id = 'receipts';

-- ============================================
-- STEP 2: CREATE STORAGE BUCKET FOR RECEIPTS
-- ============================================
-- Run this in Supabase Dashboard → Storage → Create Bucket
-- Bucket name: receipts
-- Public: false (only authenticated users can access)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf

-- Create storage bucket programmatically
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts bucket
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- STEP 3: CREATE TABLES
-- ============================================

-- 1. COMPANIES TABLE
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    country VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    tax_id VARCHAR(50),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS TABLE
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'employee')) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. APPROVAL RULES TABLE
CREATE TABLE approval_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(20) CHECK (rule_type IN ('sequential', 'percentage', 'specific', 'hybrid')) NOT NULL,
    percentage_threshold INTEGER CHECK (percentage_threshold BETWEEN 1 AND 100),
    specific_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_manager_approver BOOLEAN DEFAULT true,
    category VARCHAR(100), -- Apply rule to specific category
    min_amount DECIMAL(10,2), -- Apply rule above this amount
    max_amount DECIMAL(10,2), -- Apply rule below this amount
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. APPROVAL SEQUENCES TABLE
CREATE TABLE approval_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES approval_rules(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    sequence_order INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. EXPENSES TABLE
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE, -- Auto-generated: EXP-2025-0001
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    amount_in_company_currency DECIMAL(10,2),
    exchange_rate DECIMAL(10,6),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    merchant VARCHAR(255),
    expense_date DATE NOT NULL,
    receipt_url TEXT, -- Supabase storage URL
    receipt_file_name VARCHAR(255),
    receipt_file_size INTEGER,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'reimbursed')) DEFAULT 'pending',
    current_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_rule_id UUID REFERENCES approval_rules(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    reimbursed_at TIMESTAMP WITH TIME ZONE,
    reimbursement_method VARCHAR(50), -- bank_transfer, cash, check
    reimbursement_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EXPENSE LINE ITEMS TABLE
CREATE TABLE expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. EXPENSE APPROVALS TABLE
CREATE TABLE expense_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')) DEFAULT 'pending',
    comments TEXT,
    sequence_order INTEGER,
    is_final_approver BOOLEAN DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AUDIT LOG TABLE (Track all changes)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- created, updated, approved, rejected, etc.
    entity_type VARCHAR(50) NOT NULL, -- expense, user, approval_rule, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- expense_submitted, expense_approved, expense_rejected, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. COMPANY SETTINGS TABLE
CREATE TABLE company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    expense_number_prefix VARCHAR(10) DEFAULT 'EXP',
    expense_number_format VARCHAR(50) DEFAULT '{PREFIX}-{YEAR}-{NUMBER}',
    auto_approve_below_amount DECIMAL(10,2),
    require_receipt_above_amount DECIMAL(10,2),
    max_expense_amount DECIMAL(10,2),
    allowed_categories TEXT[], -- Array of allowed categories
    fiscal_year_start_month INTEGER DEFAULT 1,
    notification_email_enabled BOOLEAN DEFAULT true,
    notification_sms_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Companies indexes
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Users indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Expenses indexes
CREATE INDEX idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_current_approver ON expenses(current_approver_id);
CREATE INDEX idx_expenses_number ON expenses(expense_number);
CREATE INDEX idx_expenses_submitted_at ON expenses(submitted_at);

-- Expense items indexes
CREATE INDEX idx_expense_items_expense_id ON expense_items(expense_id);

-- Expense approvals indexes
CREATE INDEX idx_expense_approvals_expense_id ON expense_approvals(expense_id);
CREATE INDEX idx_expense_approvals_approver_id ON expense_approvals(approver_id);
CREATE INDEX idx_expense_approvals_status ON expense_approvals(status);

-- Approval rules indexes
CREATE INDEX idx_approval_rules_company_id ON approval_rules(company_id);
CREATE INDEX idx_approval_rules_is_active ON approval_rules(is_active);
CREATE INDEX idx_approval_rules_category ON approval_rules(category);

-- Approval sequences indexes
CREATE INDEX idx_approval_sequences_rule_id ON approval_sequences(rule_id);
CREATE INDEX idx_approval_sequences_approver_id ON approval_sequences(approver_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_expense_id ON audit_logs(expense_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- STEP 5: CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_rules_updated_at BEFORE UPDATE ON approval_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_approvals_updated_at BEFORE UPDATE ON expense_approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    year TEXT;
    next_number INTEGER;
    new_expense_number TEXT;
BEGIN
    -- Get prefix from company settings or use default
    SELECT COALESCE(expense_number_prefix, 'EXP') INTO prefix
    FROM company_settings
    WHERE company_id = NEW.company_id;
    
    IF prefix IS NULL THEN
        prefix := 'EXP';
    END IF;
    
    -- Get current year
    year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(expense_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM expenses
    WHERE company_id = NEW.company_id
    AND expense_number LIKE prefix || '-' || year || '-%';
    
    -- Generate new expense number
    new_expense_number := prefix || '-' || year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    NEW.expense_number := new_expense_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for expense number generation
CREATE TRIGGER generate_expense_number_trigger
BEFORE INSERT ON expenses
FOR EACH ROW
WHEN (NEW.expense_number IS NULL)
EXECUTE FUNCTION generate_expense_number();

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, new_values)
        VALUES (
            NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
            TG_TABLE_NAME,
            NEW.id,
            'created',
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values)
        VALUES (
            NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
            TG_TABLE_NAME,
            NEW.id,
            'updated',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values)
        VALUES (
            NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
            TG_TABLE_NAME,
            OLD.id,
            'deleted',
            to_jsonb(OLD)
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_expense_approvals AFTER INSERT OR UPDATE OR DELETE ON expense_approvals
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- STEP 6: INSERT DEFAULT DATA
-- ============================================

-- Insert default expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO expense_categories (name, description, icon) VALUES
('Food & Dining', 'Meals, restaurants, catering', 'utensils'),
('Travel', 'Flights, trains, buses', 'plane'),
('Accommodation', 'Hotels, lodging', 'bed'),
('Transportation', 'Taxi, uber, car rental', 'car'),
('Office Supplies', 'Stationery, equipment', 'briefcase'),
('Entertainment', 'Client entertainment, events', 'music'),
('Communication', 'Phone, internet', 'phone'),
('Training', 'Courses, conferences', 'book'),
('Healthcare', 'Medical expenses', 'heart'),
('Other', 'Miscellaneous expenses', 'more-horizontal')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 7: VERIFICATION QUERIES
-- ============================================

-- Count all tables
SELECT 
    'Tables Created' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show storage bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'receipts';

-- ============================================
-- STEP 8: ROW LEVEL SECURITY (OPTIONAL)
-- ============================================
-- Uncomment if you want to enable RLS

-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE approval_sequences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DATABASE SETUP COMPLETE ✓
-- ============================================
-- All tables, indexes, triggers, and functions created
-- Storage bucket configured for receipts
-- System is ready to use!
-- ============================================

SELECT '✓ Database setup complete!' as status,
       'All tables, indexes, triggers, and storage configured' as message,
       NOW() as completed_at;
