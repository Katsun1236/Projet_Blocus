import { supabase } from '../../../../assets/js/supabase-config.js';

export class AuthService {
  constructor() {
    this.supabase = supabase;
  }

  async signInWithEmail(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async registerWithEmail(email, password, userData = {}) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName || '',
            last_name: userData.lastName || ''
          }
        }
      });

      if (error) throw error;

      const user = data.user;

      if (user) {
        await this.createUserDocument(user.id, {
          email: user.email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          photo_url: `https://ui-avatars.com/api/?name=${userData.firstName || 'User'}&background=6366f1&color=fff`,
          created_at: new Date().toISOString()
        });
      }

      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pages/app/dashboard.html`
        }
      });

      if (error) throw error;

      return { user: data.user, isNewUser: false };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pages/auth/reset-password.html`
      });
      if (error) throw error;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async createUserDocument(userId, data) {
    const { error } = await this.supabase
      .from('users')
      .upsert({
        id: userId,
        ...data
      });

    if (error) throw error;
  }

  async getUserData(userId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  }

  async updateUserData(userId, updateData) {
    const { error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  }

  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  handleAuthError(error) {
    const errorMessages = {
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'Email not confirmed': 'Veuillez confirmer votre email.',
      'User already registered': 'Cette adresse email est déjà utilisée.',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
      'Invalid email': 'Adresse email invalide.'
    };

    const message = errorMessages[error.message] || error.message || 'Une erreur est survenue.';

    const err = new Error(message);
    err.code = error.code || 'auth/unknown-error';
    return err;
  }
}

export const authService = new AuthService();
