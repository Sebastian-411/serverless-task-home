import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  key: string;
  serviceRoleKey?: string;
}

export class SupabaseStorageService {
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  /**
   * Constructs a new SupabaseStorageService and initializes clients.
   *
   * @param {SupabaseConfig} config - The Supabase configuration.
   */
  constructor(private config: SupabaseConfig) {
    console.log('[SupabaseStorageService][constructor] Initializing SupabaseStorageService', { url: config.url });
    this.initialize();
  }

  /**
   * Initializes the Supabase client and admin client if service role key is provided.
   */
  private initialize(): void {
    this.client = createClient(this.config.url, this.config.key);
    
    // Crear cliente admin con service role key si está disponible
    if (this.config.serviceRoleKey) {
      this.adminClient = createClient(this.config.url, this.config.serviceRoleKey);
    }
  }

  /**
   * Gets the regular Supabase client.
   *
   * @returns {SupabaseClient} The Supabase client.
   * @throws {Error} If the client is not initialized.
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      console.error('[SupabaseStorageService][getClient] Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  /**
   * Gets the admin Supabase client (requires service role key).
   *
   * @returns {SupabaseClient} The admin Supabase client.
   * @throws {Error} If the admin client is not initialized.
   */
  private getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      console.error('[SupabaseStorageService][getAdminClient] Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized. Service role key required.');
    }
    return this.adminClient;
  }

  /**
   * Deletes all files for a specific user across all buckets.
   *
   * @param {string} userId - The user ID whose files will be deleted.
   * @returns {Promise<boolean>} True if all files were deleted successfully, false otherwise.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async deleteUserFiles(userId: string): Promise<boolean> {
    console.log('[SupabaseStorageService][deleteUserFiles] Deleting user files', { userId });
    try {
      const supabase = this.getAdminClient();
      
      // Lista todos los buckets disponibles
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[SupabaseStorageService][deleteUserFiles] Error listing buckets', { error: bucketsError });
        return false;
      }

      let allDeleted = true;

      // Itera sobre cada bucket y elimina los archivos del usuario
      for (const bucket of buckets) {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list(userId, {
            limit: 1000, // Asegura que obtengamos todos los archivos
            offset: 0
          });

        if (filesError) {
          console.error('[SupabaseStorageService][deleteUserFiles] Error listing files in bucket', { bucket: bucket.name, error: filesError });
          continue;
        }

        if (files && files.length > 0) {
          // Construye las rutas completas de los archivos
          const filePaths = files.map(file => `${userId}/${file.name}`);
          
          const { error: deleteError } = await supabase.storage
            .from(bucket.name)
            .remove(filePaths);

          if (deleteError) {
            console.error('[SupabaseStorageService][deleteUserFiles] Error deleting files from bucket', { bucket: bucket.name, error: deleteError });
            allDeleted = false;
          } else {
            console.log('[SupabaseStorageService][deleteUserFiles] Deleted files from bucket', { bucket: bucket.name, count: filePaths.length, userId });
          }
        }
      }

      return allDeleted;
    } catch (error) {
      console.error('[SupabaseStorageService][deleteUserFiles] Unexpected error deleting user files', { userId, error });
      return false;
    }
  }

  /**
   * Deletes all files for all users across all buckets.
   *
   * @returns {Promise<boolean>} True if all files were deleted successfully, false otherwise.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async deleteAllUserFiles(): Promise<boolean> {
    console.log('[SupabaseStorageService][deleteAllUserFiles] Deleting all user files');
    try {
      const supabase = this.getAdminClient();
      
      // Lista todos los buckets disponibles
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[SupabaseStorageService][deleteAllUserFiles] Error listing buckets', { error: bucketsError });
        return false;
      }

      let allDeleted = true;

      // Itera sobre cada bucket y elimina todos los archivos
      for (const bucket of buckets) {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', {
            limit: 1000,
            offset: 0
          });

        if (filesError) {
          console.error('[SupabaseStorageService][deleteAllUserFiles] Error listing files in bucket', { bucket: bucket.name, error: filesError });
          continue;
        }

        if (files && files.length > 0) {
          // Construye las rutas de todos los archivos
          const filePaths = files.map(file => file.name);
          
          const { error: deleteError } = await supabase.storage
            .from(bucket.name)
            .remove(filePaths);

          if (deleteError) {
            console.error('[SupabaseStorageService][deleteAllUserFiles] Error deleting all files from bucket', { bucket: bucket.name, error: deleteError });
            allDeleted = false;
          } else {
            console.log('[SupabaseStorageService][deleteAllUserFiles] Deleted files from bucket', { bucket: bucket.name, count: filePaths.length });
          }
        }
      }

      return allDeleted;
    } catch (error) {
      console.error('[SupabaseStorageService][deleteAllUserFiles] Unexpected error deleting all user files', { error });
      return false;
    }
  }

  /**
   * Lists all files for a specific user across all buckets.
   *
   * @param {string} userId - The user ID whose files will be listed.
   * @returns {Promise<string[]>} An array of file paths.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async listUserFiles(userId: string): Promise<string[]> {
    console.log('[SupabaseStorageService][listUserFiles] Listing user files', { userId });
    try {
      const supabase = this.getAdminClient();
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[SupabaseStorageService][listUserFiles] Error listing buckets', { error: bucketsError });
        return [];
      }

      const allFiles: string[] = [];

      for (const bucket of buckets) {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list(userId, {
            limit: 1000,
            offset: 0
          });

        if (filesError) {
          console.error('[SupabaseStorageService][listUserFiles] Error listing files in bucket', { bucket: bucket.name, error: filesError });
          continue;
        }

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${bucket.name}/${userId}/${file.name}`);
          allFiles.push(...filePaths);
        }
      }

      return allFiles;
    } catch (error) {
      console.error('[SupabaseStorageService][listUserFiles] Unexpected error listing user files', { userId, error });
      return [];
    }
  }
} 