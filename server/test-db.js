require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('✓ SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('✓ SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
  console.log('✓ GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // Test 1: Check connection
  console.log('Test 1: Checking database connection...');
  const { data: companies, error: selectError } = await supabase
    .from('companies')
    .select('*')
    .limit(1);
  
  if (selectError) {
    console.error('❌ Connection/Select failed:', selectError.message);
    if (selectError.message.includes('relation') && selectError.message.includes('does not exist')) {
      console.log('\n💡 Tables don\'t exist! Run the SQL from server/config/database.sql in Supabase SQL Editor\n');
    }
    return;
  }
  
  console.log('✅ Connection successful! Found', companies?.length || 0, 'companies\n');
  
  // Test 2: Try to insert a test company
  console.log('Test 2: Testing company insert...');
  const { data: testCompany, error: insertError } = await supabase
    .from('companies')
    .insert({
      name: 'Test Company ' + Date.now(),
      currency: 'INR',
      country: 'India'
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    if (insertError.message.includes('row-level security')) {
      console.log('\n💡 RLS (Row Level Security) is blocking inserts!');
      console.log('Solution: Run this SQL in Supabase SQL Editor:');
      console.log('ALTER TABLE companies DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE approval_rules DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE approval_sequences DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE expense_approvals DISABLE ROW LEVEL SECURITY;\n');
    }
    return;
  }
  
  console.log('✅ Insert successful!');
  console.log('Test company created:', testCompany.name, '(ID:', testCompany.id, ')\n');
  
  // Test 3: Try to insert a test user
  console.log('Test 3: Testing user insert...');
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('test123', 10);
  
  const { data: testUser, error: userError } = await supabase
    .from('users')
    .insert({
      email: 'test' + Date.now() + '@example.com',
      password_hash: passwordHash,
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
      company_id: testCompany.id
    })
    .select()
    .single();
  
  if (userError) {
    console.error('❌ User insert failed:', userError.message);
    // Clean up company
    await supabase.from('companies').delete().eq('id', testCompany.id);
    return;
  }
  
  console.log('✅ User insert successful!');
  console.log('Test user created:', testUser.email, '(ID:', testUser.id, ')\n');
  
  // Clean up
  console.log('Cleaning up test data...');
  await supabase.from('users').delete().eq('id', testUser.id);
  await supabase.from('companies').delete().eq('id', testCompany.id);
  console.log('✅ Test data cleaned up\n');
  
  console.log('🎉 All tests passed! Your database is ready to use.\n');
}

testConnection().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});