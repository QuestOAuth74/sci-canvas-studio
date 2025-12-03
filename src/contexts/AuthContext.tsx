import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Use rate-limited login edge function
    const { data, error: functionError } = await supabase.functions.invoke('rate-limited-login', {
      body: { email, password }
    });

    if (functionError) {
      toast.error(functionError.message);
      return { error: functionError };
    }

    if (!data.success) {
      const errorMessage = data.rateLimited 
        ? data.error 
        : data.remainingAttempts !== undefined
          ? `${data.error}. ${data.remainingAttempts} attempt(s) remaining.`
          : data.error;
      
      toast.error(errorMessage);
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
      
      toast.success('Welcome back!');
    }
    
    return { error: null };
  };

  const signOut = async () => {
    // Use 'local' scope to clear local session even if server logout fails
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    
    // Ignore "Session not found" errors since the goal is to be logged out
    if (error && !error.message.includes('Session not found') && !error.message.includes('session_not_found')) {
      toast.error(error.message);
    } else {
      toast.success('Signed out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
