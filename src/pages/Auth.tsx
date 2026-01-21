import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Microscope } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4 lg:p-8">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <SEOHead
        title="Sign In - BioSketch"
        description="Sign in to BioSketch to access your scientific illustrations and projects"
        noindex={true}
      />
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-stretch relative z-10">
        {/* Featured Project - Hidden on mobile */}
        <div className="hidden lg:block lg:flex-1">
          <FeaturedProjectShowcase />
        </div>

        {/* Auth Card */}
        <Card className="w-full lg:flex-1 lg:max-w-md border border-border shadow-lg">
          <div className="p-4 pb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-primary/10">
                <Microscope className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-display font-bold text-foreground">
              BioSketch
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {showUpdatePassword ? 'Set your new password' : showResetPassword ? 'Reset your password' : 'Scientific illustration made simple'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showUpdatePassword ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Set New Password</h3>
                  <p className="text-sm text-muted-foreground">Enter your new password below</p>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      data-testid={AuthTestIds.UPDATE_PASSWORD_INPUT}
                    />
                    {updatePasswordErrors.password && (
                      <p className="text-sm text-destructive" data-testid={AuthTestIds.UPDATE_ERROR_PASSWORD}>{updatePasswordErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      data-testid={AuthTestIds.UPDATE_CONFIRM_INPUT}
                    />
                    {updatePasswordErrors.confirmPassword && (
                      <p className="text-sm text-destructive" data-testid={AuthTestIds.UPDATE_ERROR_CONFIRM}>{updatePasswordErrors.confirmPassword}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid={AuthTestIds.UPDATE_SUBMIT_BUTTON}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </div>
            ) : showResetPassword ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail('');
                    setResetEmailError('');
                  }}
                  data-testid={AuthTestIds.RESET_BACK_BUTTON}
                  className="mb-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={isLoading}
                      data-testid={AuthTestIds.RESET_EMAIL_INPUT}
                    />
                    {resetEmailError && (
                      <p className="text-sm text-destructive" data-testid={AuthTestIds.RESET_ERROR_EMAIL}>{resetEmailError}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid={AuthTestIds.RESET_SEND_BUTTON}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin" data-testid={AuthTestIds.TAB_SIGNIN}>Sign In</TabsTrigger>
                  <TabsTrigger value="signup" data-testid={AuthTestIds.TAB_SIGNUP}>Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        disabled={isLoading}
                        data-testid={AuthTestIds.SIGNIN_EMAIL_INPUT}
                      />
                      {signInErrors.email && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNIN_ERROR_EMAIL}>{signInErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setShowResetPassword(true)}
                          data-testid={AuthTestIds.FORGOT_PASSWORD_LINK}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        disabled={isLoading}
                        data-testid={AuthTestIds.SIGNIN_PASSWORD_INPUT}
                      />
                      {signInErrors.password && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNIN_ERROR_PASSWORD}>{signInErrors.password}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid={AuthTestIds.SIGNIN_SUBMIT_BUTTON}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Dr. Jane Smith"
                        value={signUpFullName}
                        onChange={(e) => setSignUpFullName(e.target.value)}
                        disabled={isLoading}
                        data-testid={AuthTestIds.SIGNUP_NAME_INPUT}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        disabled={isLoading}
                        data-testid={AuthTestIds.SIGNUP_EMAIL_INPUT}
                      />
                      {signUpErrors.email && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNUP_ERROR_EMAIL}>{signUpErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        disabled={isLoading}
                        data-testid={AuthTestIds.SIGNUP_PASSWORD_INPUT}
                      />
                      {signUpErrors.password && (
                        <p className="text-sm text-destructive" data-testid={AuthTestIds.SIGNUP_ERROR_PASSWORD}>{signUpErrors.password}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-country">Country</Label>
                        <Select value={signUpCountry} onValueChange={setSignUpCountry} disabled={isLoading}>
                          <SelectTrigger id="signup-country" data-testid={AuthTestIds.SIGNUP_COUNTRY_SELECT}>
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
                        <Label htmlFor="signup-field">Field of Study</Label>
                        <Select value={signUpFieldOfStudy} onValueChange={setSignUpFieldOfStudy} disabled={isLoading}>
                          <SelectTrigger id="signup-field" data-testid={AuthTestIds.SIGNUP_FIELD_SELECT}>
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
                    <Button type="submit" className="w-full" disabled={isLoading} data-testid={AuthTestIds.SIGNUP_SUBMIT_BUTTON}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By signing up, you agree to our{' '}
                      <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/terms" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}