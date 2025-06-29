import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { UserId } from '../domain/value-objects/types';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface AuthUser {
  id: UserId;
  email: string;
  role: string;
  metadata?: Record<string, unknown>;
}

const client: SupabaseClient | null = null;

export function initialize(_config: SupabaseConfig): void {
  // TODO: Initialize Supabase client
}

export function getClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client not initialized. Call initialize() first.');
  }
  return client;
}

export async function authenticateUser(token: string): Promise<AuthUser | null> {
  try {
    const supabase = getClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id as UserId,
      email: user.email ?? '',
      role: user.user_metadata?.role ?? 'user',
      metadata: user.user_metadata
    };
  } catch {
    // Log error for debugging but don't expose details
    return null;
  }
}

export async function createUser(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthUser | null> {
  try {
    const supabase = getClient();
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error || !user) {
      return null;
    }

    return {
      id: user.id as UserId,
      email: user.email ?? '',
      role: user.user_metadata?.role ?? 'user',
      metadata: user.user_metadata
    };
  } catch {
    return null;
  }
}

export async function updateUserRole(userId: UserId, role: string): Promise<boolean> {
  try {
    const supabase = getClient();
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role }
    });

    return !error;
  } catch {
    return false;
  }
} 