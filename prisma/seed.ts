import { PrismaClient, UserRole } from '../lib/generated/prisma';
import { SupabaseAuthService } from '../core/auth/infrastructure/adapters/out/supabase-auth.service';
import type { AuthUser, AuthResult } from '../core/auth/domain/ports/out/auth-service.port';
import 'dotenv/config';

const prisma = new PrismaClient();

// Initialize Supabase service
const supabaseService = new SupabaseAuthService({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// User credentials type
type UserCredentials = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};

// Admin user credentials
const ADMIN_CREDENTIALS: UserCredentials = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: 'Juansebastia4231',
  phoneNumber: '+1234567890',
  role: UserRole.ADMIN,
};

// Regular user credentials for testing
const REGULAR_USER_CREDENTIALS: UserCredentials = {
  name: 'Test User',
  email: 'user@test.com',
  password: 'Juansebastia4231',
  phoneNumber: '+1987654321',
  role: UserRole.USER,
};

/**
 * Checks if the result is an AuthResult (contains user and token).
 *
 * @param {AuthUser | AuthResult} result - The result to check.
 * @returns {boolean} True if result is AuthResult, false otherwise.
 */
function isAuthResult(result: AuthUser | AuthResult): result is AuthResult {
  return 'user' in result && 'token' in result;
}

/**
 * Extracts the email from an AuthUser or AuthResult.
 *
 * @param {AuthUser | AuthResult} result - The result object.
 * @returns {string} The user's email.
 */
function getEmailFromAuthResponse(result: AuthUser | AuthResult): string {
  return isAuthResult(result) ? result.user.email : result.email;
}

/**
 * Extracts the user ID from an AuthUser or AuthResult.
 *
 * @param {AuthUser | AuthResult} result - The result object.
 * @returns {string} The user's ID.
 */
function getUserIdFromAuthResponse(result: AuthUser | AuthResult): string {
  return isAuthResult(result) ? result.user.id : result.id;
}

/**
 * Creates a user in Supabase Auth. If the user already exists, attempts to authenticate and return their info.
 *
 * @param {UserCredentials} credentials - The user's credentials.
 * @returns {Promise<AuthUser | AuthResult>} The created or authenticated user.
 * @throws {Error} If user creation or authentication fails.
 */
async function createUserInSupabase(credentials: UserCredentials) {
  console.log(`[seed][createUserInSupabase] Creating ${credentials.role.toLowerCase()} user in Supabase Auth...`, { email: credentials.email });
  try {
    const user = await supabaseService.createUser(
      credentials.email,
      credentials.password
    );
    if (!user) {
      console.log(`[seed][createUserInSupabase] User already exists in Supabase, authenticating...`, { email: credentials.email });
      const authUser = await supabaseService.authenticateUser(
        credentials.email,
        credentials.password
      );
      if (!authUser) {
        console.error('[seed][createUserInSupabase] Error getting existing user from Supabase', { email: credentials.email });
        throw new Error(`Error getting existing user from Supabase: ${credentials.email}`);
      }
      return authUser;
    }
    console.log(`[seed][createUserInSupabase] User created in Supabase`, { email: credentials.email, userId: user.id });
    return user;
  } catch (error) {
    console.error('[seed][createUserInSupabase] Error with Supabase Auth', { email: credentials.email, error });
    throw error;
  }
}

/**
 * Creates a user in the local database using the Supabase user ID.
 *
 * @param {AuthUser | AuthResult} supabaseUser - The Supabase user or auth result.
 * @param {UserCredentials} credentials - The user's credentials.
 * @returns {Promise<any>} The created or updated user in the local database.
 */
async function createUserInDatabase(supabaseUser: AuthUser | AuthResult, credentials: UserCredentials) {
  console.log(`[seed][createUserInDatabase] Creating ${credentials.role.toLowerCase()} user in local database...`, { email: credentials.email });
  const userId = getUserIdFromAuthResponse(supabaseUser);
  const userData = {
    id: userId,
    name: credentials.name,
    email: credentials.email,
    phoneNumber: credentials.phoneNumber,
    role: credentials.role,
  };
  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    update: userData,
    create: userData,
  });
  console.log(`[seed][createUserInDatabase] User synced in DB`, { email: dbUser.email, userId: dbUser.id });
  return dbUser;
}

/**
 * Creates a user in both Supabase Auth and the local database.
 *
 * @param {UserCredentials} credentials - The user's credentials.
 * @returns {Promise<{ supabaseUser: AuthUser | AuthResult, localUser: any }>} The created user objects.
 */
async function seedUser(credentials: UserCredentials) {
  console.log(`[seed][seedUser] Starting ${credentials.role.toLowerCase()} user creation...`, { email: credentials.email });
  const supabaseUser = await createUserInSupabase(credentials);
  const localUser = await createUserInDatabase(supabaseUser, credentials);
  return {
    supabaseUser,
    localUser
  };
}

/**
 * Cleans all users and files from Supabase (Auth + Storage).
 *
 * @returns {Promise<void>} Resolves when cleaning is complete.
 */
async function cleanSupabaseData() {
  console.log('[seed][cleanSupabaseData] Cleaning Supabase data (Auth + Storage)...');
  try {
    const deleted = await supabaseService.deleteAllUsers();
    if (deleted) {
      console.log('[seed][cleanSupabaseData] Supabase data cleaned successfully');
    } else {
      console.warn('[seed][cleanSupabaseData] Some Supabase data could not be cleaned');
    }
  } catch (error) {
    console.error('[seed][cleanSupabaseData] Error cleaning Supabase data', { error });
  }
}

/**
 * Main function to seed the database and Supabase Auth/Storage.
 *
 * @returns {Promise<void>} Resolves when seeding is complete.
 */
async function main() {
  console.log('[seed][main] Starting database seed...');
  console.log('');
  try {
    console.log('[seed][main] Cleaning existing data...');
    await cleanSupabaseData();
    await prisma.user.deleteMany();
    await prisma.address.deleteMany();
    console.log('[seed][main] Data cleaned');
    console.log('');
    console.log('[seed][main] Creating Admin User...');
    const adminResult = await seedUser(ADMIN_CREDENTIALS);
    console.log('');
    console.log('[seed][main] Creating Regular User...');
    const userResult = await seedUser(REGULAR_USER_CREDENTIALS);
    console.log('');
    console.log('[seed][main] Seed completed successfully!');
    console.log('');
    console.log('[seed][main] Summary:', {
      adminSupabase: getEmailFromAuthResponse(adminResult.supabaseUser),
      adminLocal: adminResult.localUser.email,
      adminRole: adminResult.localUser.role,
      userSupabase: getEmailFromAuthResponse(userResult.supabaseUser),
      userLocal: userResult.localUser.email,
      userRole: userResult.localUser.role
    });
    console.log('');
    console.log('[seed][main] Credentials for Postman:', {
      adminEmail: adminResult.localUser.email,
      adminPassword: ADMIN_CREDENTIALS.password,
      userEmail: userResult.localUser.email,
      userPassword: REGULAR_USER_CREDENTIALS.password
    });
  } catch (error) {
    console.error('[seed][main] Error during seed', { error });
    console.log('');
    console.log('[seed][main] Possible solutions:');
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