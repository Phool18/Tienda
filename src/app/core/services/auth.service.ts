// src/app/core/services/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router   = inject(Router);

  private _profile = signal<Profile | null>(null);

  readonly profile    = this._profile.asReadonly();
  readonly isLoggedIn = computed(() => !!this._profile());
  readonly isAdmin    = computed(() => this._profile()?.role === 'ADMIN');
  readonly isUser     = computed(() => this._profile()?.role === 'USER');

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this.loadProfile(data.session.user.id);
      }
    });
  }

  private async loadProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error cargando perfil:', error);
      return null;
    }
    this._profile.set(data as Profile);
    return data as Profile;
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    return !!data;
  }

  async register(email: string, password: string, fullName: string, phone: string) {
    const phoneExists = await this.checkPhoneExists(phone);
    if (phoneExists) {
      throw new Error('PHONE_EXISTS');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } }
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new Error('EMAIL_EXISTS');
      }
      throw error;
    }

    return data;
  }

  async login(email: string, password: string): Promise<'ADMIN' | 'USER'> {
    const { data: authData, error: authError } = await this.supabase.auth
      .signInWithPassword({ email, password });

    if (authError) throw authError;

    const userId = authData.user.id;
    const profile = await this.loadProfile(userId);

    if (!profile) {
      const { data: newProfile, error: insertError } = await this.supabase
        .from('profiles')
        .insert({
          id:        userId,
          full_name: authData.user.user_metadata?.['full_name'] ?? email.split('@')[0],
          phone:     authData.user.user_metadata?.['phone'] ?? '',
          role:      'USER'
        })
        .select()
        .single();

      if (insertError) throw new Error('No se pudo cargar el perfil');

      this._profile.set(newProfile as Profile);
      return 'USER';
    }

    return profile.role;
  }

  logout() {
    this._profile.set(null);
    this.router.navigate(['/login']);
    this.supabase.auth.signOut();
  }
}
