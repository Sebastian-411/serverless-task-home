#!/usr/bin/env tsx

import { SupabaseAuthService } from '../core/auth/infrastructure/adapters/out/supabase-auth.service';
import { SupabaseStorageService } from '../core/auth/infrastructure/adapters/out/supabase-storage.service';
import 'dotenv/config';

/**
 * Script para limpiar manualmente Supabase Storage y Auth
 * 
 * Uso:
 * - npm run cleanup:storage    # Solo limpia Storage
 * - npm run cleanup:auth       # Solo limpia Auth
 * - npm run cleanup:all        # Limpia Storage y Auth
 */

const supabaseConfig = {
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

const authService = new SupabaseAuthService(supabaseConfig);
const storageService = new SupabaseStorageService(supabaseConfig);

/**
 * Cleans all files from Supabase Storage.
 *
 * @returns {Promise<void>} Resolves when cleanup is complete.
 * @throws {Error} If the operation fails unexpectedly.
 */
async function cleanupStorage() {
  console.log('[cleanup-supabase][cleanupStorage] Cleaning Supabase Storage...');
  try {
    const deleted = await storageService.deleteAllUserFiles();
    if (deleted) {
      console.log('[cleanup-supabase][cleanupStorage] Supabase Storage cleaned successfully');
    } else {
      console.warn('[cleanup-supabase][cleanupStorage] Some files could not be deleted from Storage');
    }
  } catch (error) {
    console.error('[cleanup-supabase][cleanupStorage] Error cleaning Supabase Storage', { error });
  }
}

/**
 * Cleans all users from Supabase Auth.
 *
 * @returns {Promise<void>} Resolves when cleanup is complete.
 * @throws {Error} If the operation fails unexpectedly.
 */
async function cleanupAuth() {
  console.log('[cleanup-supabase][cleanupAuth] Cleaning Supabase Auth...');
  try {
    const deleted = await authService.deleteAllUsers();
    if (deleted) {
      console.log('[cleanup-supabase][cleanupAuth] Supabase Auth cleaned successfully');
    } else {
      console.warn('[cleanup-supabase][cleanupAuth] Some users could not be deleted from Auth');
    }
  } catch (error) {
    console.error('[cleanup-supabase][cleanupAuth] Error cleaning Supabase Auth', { error });
  }
}

/**
 * Cleans all files and users from Supabase Storage and Auth.
 *
 * @returns {Promise<void>} Resolves when cleanup is complete.
 * @throws {Error} If the operation fails unexpectedly.
 */
async function cleanupAll() {
  console.log('[cleanup-supabase][cleanupAll] Cleaning Supabase Storage and Auth...');
  try {
    await cleanupStorage();
    console.log('');
    await cleanupAuth();
    console.log('');
    console.log('[cleanup-supabase][cleanupAll] Full cleanup completed successfully');
  } catch (error) {
    console.error('[cleanup-supabase][cleanupAll] Error during full cleanup', { error });
  }
}

/**
 * Main entry point for the Supabase cleanup script.
 *
 * Reads the command from process arguments and runs the appropriate cleanup function.
 *
 * @returns {Promise<void>} Resolves when the script completes.
 */
async function main() {
  const command = process.argv[2];
  console.log('[cleanup-supabase][main] Starting Supabase cleanup...');
  console.log('');
  switch (command) {
    case 'storage':
      await cleanupStorage();
      break;
    case 'auth':
      await cleanupAuth();
      break;
    case 'all':
      await cleanupAll();
      break;
    default:
      console.warn('[cleanup-supabase][main] Invalid command', { command });
      console.log('Usage:');
      console.log('   npm run cleanup:storage  # Only Storage');
      console.log('   npm run cleanup:auth     # Only Auth');
      console.log('   npm run cleanup:all      # Storage and Auth');
      process.exit(1);
  }
  console.log('');
  console.log('[cleanup-supabase][main] Cleanup process completed');
}

main().catch(error => {
  console.error('[cleanup-supabase][main] Unhandled error', { error });
}); 