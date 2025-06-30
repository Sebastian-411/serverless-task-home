import { PrismaClient, UserRole } from '../lib/generated/prisma';
import { SupabaseAuthService } from '../core/auth/infrastructure/adapters/out/supabase-auth.service';
import 'dotenv/config';

const prisma = new PrismaClient();

// Initialize Supabase service
const supabaseService = new SupabaseAuthService({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!
});

// Admin user credentials
const ADMIN_CREDENTIALS = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: 'Juansebastia4231',
  phoneNumber: '+1234567890',
  role: UserRole.ADMIN,
};

async function createAdminInSupabase() {
  console.log('🔐 Creating admin user in Supabase Auth...');
  
  try {
    const user = await supabaseService.createUser(
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password
    );

    if (!user) {
      // If user already exists, try to authenticate to get their ID
      console.log('⚠️  User already exists in Supabase, getting ID...');
      
      const authUser = await supabaseService.authenticateUser(
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      );
      
      if (!authUser) {
        throw new Error('Error getting existing user from Supabase');
      }
      
      return authUser;
    }

    console.log(`✅ Admin user created in Supabase: ${user.id}`);
    return user;
    
  } catch (error) {
    console.error('❌ Error with Supabase Auth:', error.message);
    throw error;
  }
}

async function createAdminInDatabase(supabaseUser: any) {
  console.log('💾 Creating admin user in local database...');
  
  const userData = {
    id: supabaseUser.id,
    name: ADMIN_CREDENTIALS.name,
    email: ADMIN_CREDENTIALS.email,
    phoneNumber: ADMIN_CREDENTIALS.phoneNumber,
    role: ADMIN_CREDENTIALS.role,
  };

  const adminUser = await prisma.user.upsert({
    where: { id: supabaseUser.id },
    update: userData,
    create: userData,
  });

  console.log(`✅ Admin user synced in DB: ${adminUser.email}`);
  return adminUser;
}

async function seedAdmin() {
  console.log('👤 Starting admin user creation...');
  
  // 1. Create user in Supabase Auth
  const supabaseUser = await createAdminInSupabase();
  
  // 2. Create user in local database with Supabase ID
  const localUser = await createAdminInDatabase(supabaseUser);
  
  return {
    supabaseUser,
    localUser
  };
}

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('');

  try {
    // Clean existing data (optional)
    console.log('🧹 Cleaning existing data...');
    await prisma.user.deleteMany();
    await prisma.address.deleteMany();
    console.log('✅ Data cleaned');
    console.log('');

    // Create complete admin user (Supabase + Local DB)
    const result = await seedAdmin();
    console.log('');

    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • User in Supabase Auth: ${result.supabaseUser.email}`);
    console.log(`   • User in Local DB: ${result.localUser.email}`);
    console.log(`   • Role: ${result.localUser.role}`);
    console.log('');
    console.log('✅ All set! Admin user is created on both sides.');
    console.log('');
    console.log('💡 Credentials for Postman:');
    console.log(`   • Email: ${result.localUser.email}`);
    console.log(`   • Password: admin123`);

  } catch (error) {
    console.error('❌ Error during seed:', error.message);
    console.log('');
    console.log('🔧 Possible solutions:');
    console.log('   1. Verify environment variables are configured:');
    console.log('      - DATABASE_URL');
    console.log('      - SUPABASE_URL');
    console.log('      - SUPABASE_ANON_KEY');
    console.log('   2. Make sure the database is accessible');
    console.log('   3. Verify that Supabase is working correctly');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 