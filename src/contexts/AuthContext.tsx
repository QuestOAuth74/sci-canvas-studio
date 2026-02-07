import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers';
import { ToastTestIds } from '@/lib/test-ids';

// Check if local auth mode is enabled
const LOCAL_AUTH_ENABLED = import.meta.env.VITE_LOCAL_AUTH === 'true';
const LOCAL_AUTH_STORAGE_KEY = 'local_auth_user';

// Create a mock user for local development
const createMockUser = (email: string, fullName?: string): User => ({
  id: crypto.randomUUID(),
  email,
  app_metadata: {},
  user_metadata: {
    full_name: fullName || email.split('@')[0],
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  role: 'authenticated',
} as User);

// Create a mock session for local development
const createMockSession = (user: User): Session => ({
  access_token: 'local_mock_token_' + user.id,
  refresh_token: 'local_mock_refresh_' + user.id,
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user,
});

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, country?: string, fieldOfStudy?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Local auth mode - check localStorage for existing session
    if (LOCAL_AUTH_ENABLED) {
      const storedAuth = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
      if (storedAuth) {
        try {
          const { user: storedUser, session: storedSession, isAdmin: storedIsAdmin } = JSON.parse(storedAuth);
          setUser(storedUser);
          setSession(storedSession);
          setIsAdmin(storedIsAdmin);
        } catch (e) {
          localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
        }
      }
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, country?: string, fieldOfStudy?: string) => {
    // Local auth mode - create user immediately without email verification
    if (LOCAL_AUTH_ENABLED) {
      const mockUser = createMockUser(email, fullName);
      mockUser.user_metadata = {
        ...mockUser.user_metadata,
        country: country || '',
        field_of_study: fieldOfStudy || '',
      };
      const mockSession = createMockSession(mockUser);

      setUser(mockUser);
      setSession(mockSession);
      setIsAdmin(true); // Grant admin access in local mode

      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify({
        user: mockUser,
        session: mockSession,
        isAdmin: true,
      }));

      showSuccessToast('Account created! (Local mode - no email verification needed)', ToastTestIds.AUTH_SIGNUP_SUCCESS);
      return { error: null };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          country: country || '',
          field_of_study: fieldOfStudy || ''
        }
      }
    });

    if (error) {
      console.error('Error during sign up:', error);
      showErrorToast(error.message, ToastTestIds.AUTH_SIGNUP_ERROR);
    } else {
      showSuccessToast('Account created! Please check your email to verify.', ToastTestIds.AUTH_SIGNUP_SUCCESS);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Local auth mode - accept any credentials
    if (LOCAL_AUTH_ENABLED) {
      const mockUser = createMockUser(email);
      const mockSession = createMockSession(mockUser);

      setUser(mockUser);
      setSession(mockSession);
      setIsAdmin(true); // Grant admin access in local mode

      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify({
        user: mockUser,
        session: mockSession,
        isAdmin: true,
      }));

      showSuccessToast('Welcome back! (Local mode)', ToastTestIds.AUTH_SIGNIN_SUCCESS);
      return { error: null };
    }

    // Use rate-limited login edge function
    const { data, error: functionError } = await supabase.functions.invoke('rate-limited-login', {
      body: { email, password }
    });

    if (functionError) {
      console.error('Error during sign in:', functionError);
      showErrorToast(functionError.message, ToastTestIds.AUTH_SIGNIN_ERROR);
      return { error: functionError };
    }

    if (!data.success) {
      // Check for unverified email
      const isUnverified = data.error?.toLowerCase().includes('not confirmed');

      if (isUnverified) {
        // Auto-resend verification email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email
        });

        if (!resendError) {
          showErrorToast("Email not verified. We've sent you a new verification link.", ToastTestIds.AUTH_EMAIL_UNVERIFIED);
          sessionStorage.setItem('verifyEmail', email);
          return {
            error: {
              message: 'Email not verified',
              redirect: '/auth/verify-email?resent=true'
            }
          };
        } else {
          showErrorToast("Email not verified. Please check your inbox for the verification link.", ToastTestIds.AUTH_EMAIL_UNVERIFIED);
          sessionStorage.setItem('verifyEmail', email);
          return {
            error: {
              message: 'Email not verified',
              redirect: '/auth/verify-email'
            }
          };
        }
      }

      const errorMessage = data.rateLimited
        ? data.error
        : data.remainingAttempts !== undefined
          ? `${data.error}. ${data.remainingAttempts} attempt(s) remaining.`
          : data.error;

      console.error('Sign in failed:', data.error);
      showErrorToast(errorMessage, ToastTestIds.AUTH_SIGNIN_ERROR);
      return { error: { message: data.error } };
    }

    // Set the session from the edge function response
    if (data.session) {
      await supabase.auth.setSession(data.session);

      // Update last login timestamp
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.session.user.id);

      showSuccessToast('Welcome back!', ToastTestIds.AUTH_SIGNIN_SUCCESS);
    }

    return { error: null };
  };

  const signOut = async () => {
    // Local auth mode - just clear localStorage
    if (LOCAL_AUTH_ENABLED) {
      localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      showSuccessToast('Signed out successfully (Local mode)', ToastTestIds.AUTH_SIGNOUT_SUCCESS);
      return;
    }

    // Use 'local' scope to clear local session even if server logout fails
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    // Ignore session-related errors since the goal is to be logged out anyway
    const isSessionError = error && (
      error.message.includes('Session not found') ||
      error.message.includes('session_not_found') ||
      error.message.includes('session missing') ||
      error.message.includes('AuthSessionMissingError')
    );

    if (error && !isSessionError) {
      console.error('Error during sign out:', error);
      showErrorToast(error.message, ToastTestIds.AUTH_SIGNOUT_ERROR);
    } else {
      showSuccessToast('Signed out successfully', ToastTestIds.AUTH_SIGNOUT_SUCCESS);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
