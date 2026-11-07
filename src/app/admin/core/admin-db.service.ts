import { Injectable, computed, signal } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/**
 * The admin panel's only door to the database.
 *
 * supabase-js is loaded on demand, so it lives in the admin chunk and never
 * slows down the public website. Every query runs as the logged-in user;
 * database rules (RLS + is_admin()) decide what an admin may read or change.
 */
@Injectable({ providedIn: 'root' })
export class AdminDbService {
  private client?: Promise<SupabaseClient>;

  readonly session = signal<Session | null>(null);
  /** 'admin' (everything) or 'staff' (leads, bookings, customers); null = not office staff. */
  readonly role = signal<'admin' | 'staff' | null>(null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isStaff = computed(() => this.role() !== null);
  readonly userId = computed(() => this.session()?.user.id ?? '');
  /** Name shown in follow-ups and the activity log. */
  readonly name = signal('');
  readonly email = computed(() => this.session()?.user.email ?? '');

  /** The Supabase client (created once, on first use). */
  db(): Promise<SupabaseClient> {
    this.client ??= import('@supabase/supabase-js').then(({ createClient }) => {
      const c = createClient(environment.supabaseUrl, environment.supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'kc-admin-auth',
        },
      });
      c.auth.onAuthStateChange((_event, s) => {
        this.session.set(s);
        if (!s) this.role.set(null);
      });
      return c;
    });
    return this.client;
  }

  /** Restores the saved login and checks the office role. */
  async check(): Promise<boolean> {
    const db = await this.db();
    const { data } = await db.auth.getSession();
    this.session.set(data.session);
    if (!data.session) return false;
    const { data: profile } = await db
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.session.user.id)
      .maybeSingle();
    const role = profile?.role === 'admin' || profile?.role === 'staff' ? profile.role : null;
    this.role.set(role);
    this.name.set(profile?.full_name || data.session.user.email || '');
    return role !== null;
  }

  async login(email: string, password: string): Promise<string | null> {
    const db = await this.db();
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message;
    if (!(await this.check())) {
      await db.auth.signOut();
      return 'This login has no office access. Ask the admin to add you in Staff.';
    }
    return null;
  }

  async logout(): Promise<void> {
    await (await this.db()).auth.signOut();
    this.session.set(null);
    this.role.set(null);
  }

  /** Bearer token for kitecab-backend admin endpoints. */
  async token(): Promise<string> {
    const { data } = await (await this.db()).auth.getSession();
    return data.session?.access_token ?? '';
  }

  /** POST to kitecab-backend as the admin (WhatsApp resend, payment links). */
  async api<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${environment.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.token()}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as { message?: string }).message ?? `Request failed (${res.status})`);
    return json as T;
  }
}
