import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Microscope } from 'lucide-react';
import { motion } from 'framer-motion';
import DotPattern from '@/components/ui/dot-pattern';
import { cn } from '@/lib/utils';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEO/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedProjectShowcase } from '@/components/auth/FeaturedProjectShowcase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, FIELDS_OF_STUDY } from '@/lib/constants';
import { AuthTestIds, ToastTestIds } from '@/lib/test-ids';
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  country: z.string().min(1, 'Country is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required')
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatePasswordErrors, setUpdatePasswordErrors] = useState<any>({});

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpCountry, setSignUpCountry] = useState('');
  const [signUpFieldOfStudy, setSignUpFieldOfStudy] = useState('');

  // Error states
  const [signInErrors, setSignInErrors] = useState<any>({});
  const [signUpErrors, setSignUpErrors] = useState<any>({});


  useEffect(() => {
    // Check if this is a password reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery' || type === 'magiclink') {
      setShowUpdatePassword(true);
      setShowResetPassword(false);
    }
  }, []);

  useEffect(() => {
    // Don't redirect if we're updating password
    if (user && !loading && !showUpdatePassword) {
      navigate('/');
    }
  }, [user, loading, showUpdatePassword, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});

    const result = signInSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!result.success) {
      const errors: any = {};
      result.error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setSignInErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setIsLoading(false);

    if (error) {
      // Check if error includes redirect instruction
      if (error.redirect) {
        navigate(error.redirect);
      }
      // Error toast already shown in AuthContext
    } else {
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});

    const result = signUpSchema.safeParse({ 
      email: signUpEmail, 
      password: signUpPassword,
      fullName: signUpFullName,
      country: signUpCountry,
      fieldOfStudy: signUpFieldOfStudy
    });
    
    if (!result.success) {
      const errors: any = {};
      result.error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setSignUpErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName, signUpCountry, signUpFieldOfStudy);
    setIsLoading(false);

    if (!error) {
      sessionStorage.setItem('verifyEmail', signUpEmail);
      navigate('/auth/verify-email');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetEmailError('');

    const result = resetPasswordSchema.safeParse({ email: resetEmail });
    if (!result.success) {
      setResetEmailError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsLoading(false);

    if (error) {
      console.error('Error resetting password:', error);
      showErrorToast(error.message, ToastTestIds.PASSWORD_RESET_SENT_ERROR);
    } else {
      showSuccessToast("Check your email. We've sent you a password reset link.", ToastTestIds.PASSWORD_RESET_SENT_SUCCESS);
      setResetEmail('');
      setShowResetPassword(false);
      setActiveTab('signin');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordErrors({});

    const result = updatePasswordSchema.safeParse({ 
      password: newPassword, 
      confirmPassword: confirmPassword 
    });
    
    if (!result.success) {
      const errors: any = {};
      result.error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setUpdatePasswordErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setIsLoading(false);

    if (error) {
      console.error('Error updating password:', error);
      showErrorToast(error.message, ToastTestIds.PASSWORD_UPDATE_ERROR);
    } else {
      showSuccessToast("Password updated! You can now sign in with your new password.", ToastTestIds.PASSWORD_UPDATE_SUCCESS);
      setNewPassword('');
      setConfirmPassword('');
      setShowUpdatePassword(false);
      // Sign out to force re-login with new password
      await supabase.auth.signOut();
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <SEOHead
        title="Sign In - BioSketch"
        description="Sign in to BioSketch to access your scientific illustrations and projects"
        noindex={true}
      />

      {/* Left Side - Featured Project (Desktop) */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 1.4 }}
            className="blob-1 top-[-50px] left-[-50px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1.6, delay: 0.3 }}
            className="blob-2 bottom-[10%] right-[-50px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.25, scale: 1 }}
            transition={{ duration: 1.8, delay: 0.5 }}
            className="blob-3 top-[40%] left-[20%]"
          />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl" />
        </div>

        {/* Background Pattern */}
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(30vw_circle_at_center,white,transparent)]",
            "opacity-20"
          )}
        />

        <div className="relative z-10">
          <FeaturedProjectShowcase />
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/80 pointer-events-none" />

        {/* Top Bar */}
        <div className="p-6 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Auth Content */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm space-y-8"
          >
            {/* Logo & Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/25">
                <Microscope className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {showUpdatePassword ? 'Set new password' : showResetPassword ? 'Reset password' : 'Welcome back'}
              </h1>
              <p className="text-sm text-slate-500">
                {showUpdatePassword ? 'Enter your new password below' : showResetPassword ? 'We\'ll send you a reset link' : 'Sign in to continue to BioSketch'}
              </p>
            </div>

            {showUpdatePassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                    data-testid={AuthTestIds.UPDATE_PASSWORD_INPUT}
                  />
                  {updatePasswordErrors.password && (
                    <p className="text-sm text-destructive" data-testid={AuthTestIds.UPDATE_ERROR_PASSWORD}>{updatePasswordErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                    data-testid={AuthTestIds.UPDATE_CONFIRM_INPUT}
                  />
                  {updatePasswordErrors.confirmPassword && (
                    <p className="text-sm text-destructive" data-testid={AuthTestIds.UPDATE_ERROR_CONFIRM}>{updatePasswordErrors.confirmPassword}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid={AuthTestIds.UPDATE_SUBMIT_BUTTON}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            ) : showResetPassword ? (
              <div className="space-y-4">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-11"
                      data-testid={AuthTestIds.RESET_EMAIL_INPUT}
                    />
                    {resetEmailError && (
                      <p className="text-sm text-destructive" data-testid={AuthTestIds.RESET_ERROR_EMAIL}>{resetEmailError}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid={AuthTestIds.RESET_SEND_BUTTON}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail('');
                    setResetEmailError('');
                  }}
                  data-testid={AuthTestIds.RESET_BACK_BUTTON}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tab Switcher */}
                <div className="flex rounded-2xl glass-card p-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === 'signin'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/25'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    data-testid={AuthTestIds.TAB_SIGNIN}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === 'signup'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/25'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    data-testid={AuthTestIds.TAB_SIGNUP}
                  >
                    Sign Up
                  </button>
                </div>

                {activeTab === 'signin' ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        data-testid={AuthTestIds.SIGNIN_EMAIL_INPUT}
                      />
                      {signInErrors.email && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNIN_ERROR_EMAIL}>{signInErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-sm">Password</Label>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowResetPassword(true)}
                          data-testid={AuthTestIds.FORGOT_PASSWORD_LINK}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        data-testid={AuthTestIds.SIGNIN_PASSWORD_INPUT}
                      />
                      {signInErrors.password && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNIN_ERROR_PASSWORD}>{signInErrors.password}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid={AuthTestIds.SIGNIN_SUBMIT_BUTTON}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Dr. Jane Smith"
                        value={signUpFullName}
                        onChange={(e) => setSignUpFullName(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        data-testid={AuthTestIds.SIGNUP_NAME_INPUT}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        data-testid={AuthTestIds.SIGNUP_EMAIL_INPUT}
                      />
                      {signUpErrors.email && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNUP_ERROR_EMAIL}>{signUpErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                        data-testid={AuthTestIds.SIGNUP_PASSWORD_INPUT}
                      />
                      {signUpErrors.password && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNUP_ERROR_PASSWORD}>{signUpErrors.password}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-country" className="text-sm">Country</Label>
                        <Select value={signUpCountry} onValueChange={setSignUpCountry} disabled={isLoading}>
                          <SelectTrigger id="signup-country" className="h-11" data-testid={AuthTestIds.SIGNUP_COUNTRY_SELECT}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {signUpErrors.country && (
                          <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNUP_ERROR_COUNTRY}>{signUpErrors.country}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-field" className="text-sm">Field</Label>
                        <Select value={signUpFieldOfStudy} onValueChange={setSignUpFieldOfStudy} disabled={isLoading}>
                          <SelectTrigger id="signup-field" className="h-11" data-testid={AuthTestIds.SIGNUP_FIELD_SELECT}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELDS_OF_STUDY.map((field) => (
                              <SelectItem key={field} value={field}>{field}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {signUpErrors.fieldOfStudy && (
                          <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNUP_ERROR_FIELD}>{signUpErrors.fieldOfStudy}</p>
                        )}
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid={AuthTestIds.SIGNUP_SUBMIT_BUTTON}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By signing up, you agree to our{' '}
                      <a href="/terms" className="text-foreground hover:underline">Terms</a>
                      {' '}and{' '}
                      <a href="/terms" className="text-foreground hover:underline">Privacy Policy</a>
                    </p>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="p-6 text-center relative z-10">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} BioSketch. Free forever.
          </p>
        </div>
      </div>
    </div>
  );
}