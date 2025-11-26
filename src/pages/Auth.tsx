import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Microscope, Beaker, FlaskConical, Dna, TestTube, Pill, Syringe, Brain, Heart, Atom, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEO/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedProjectShowcase } from '@/components/auth/FeaturedProjectShowcase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, FIELDS_OF_STUDY } from '@/lib/constants';

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

  // Floating lab icons configuration
  const floatingIcons = [
    { Icon: Microscope, top: '10%', left: '5%', size: 48, speed: 'slow', delay: '0s' },
    { Icon: Beaker, top: '15%', right: '8%', size: 56, speed: 'medium', delay: '2s' },
    { Icon: FlaskConical, top: '45%', left: '3%', size: 44, speed: 'fast', delay: '1s' },
    { Icon: Dna, top: '65%', right: '5%', size: 52, speed: 'slow', delay: '3s' },
    { Icon: TestTube, top: '30%', right: '15%', size: 40, speed: 'medium', delay: '1.5s' },
    { Icon: Pill, top: '75%', left: '10%', size: 36, speed: 'fast', delay: '2.5s' },
    { Icon: Syringe, top: '20%', left: '20%', size: 42, speed: 'slow', delay: '4s' },
    { Icon: Brain, top: '55%', right: '20%', size: 50, speed: 'medium', delay: '0.5s' },
    { Icon: Heart, top: '85%', right: '12%', size: 46, speed: 'fast', delay: '3.5s' },
    { Icon: Atom, top: '40%', left: '15%', size: 38, speed: 'slow', delay: '1s' },
  ];

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

    if (!error) {
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
      setActiveTab('signin');
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link. Please check your inbox.",
      });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now sign in with your new password.",
      });
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
      <div className="min-h-screen flex items-center justify-center notebook-page graph-paper relative overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--ink-blue))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center notebook-page graph-paper relative overflow-hidden p-4 lg:p-8">
      {/* Decorative notebook elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Lab Icons - styled as pencil sketches */}
        {floatingIcons.map((config, index) => {
          const IconComponent = config.Icon;
          const style: React.CSSProperties = {
            top: config.top,
            left: config.left,
            right: config.right,
            animationDelay: config.delay,
          };
          
          return (
            <IconComponent
              key={index}
              size={config.size}
              className={`floating-icon ${config.speed} text-[hsl(var(--pencil-gray))]/20`}
              style={style}
              aria-hidden="true"
            />
          );
        })}
      </div>

      <SEOHead
        title="Sign In - BioSketch"
        description="Sign in to BioSketch to access your scientific illustrations and projects"
        noindex={true}
      />
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-stretch relative z-10">
        {/* Featured Project - Hidden on mobile */}
        <div className="hidden lg:block lg:flex-1">
          <FeaturedProjectShowcase />
        </div>

        {/* Auth Card */}
        <Card className="w-full lg:flex-1 lg:max-w-md paper-shadow border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="p-4 pb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-2 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-4xl font-bold text-center handwritten text-[hsl(var(--ink-blue))]">
            BioSketch
          </CardTitle>
          <CardDescription className="text-center font-source-serif text-[hsl(var(--pencil-gray))]">
            {showUpdatePassword ? 'Set your new password' : showResetPassword ? 'Reset your password' : 'Create and manage your diagrams'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showUpdatePassword ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold font-source-serif ink-text">Set New Password</h3>
                <p className="text-sm text-[hsl(var(--pencil-gray))]">Enter your new password below</p>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="font-source-serif ink-text">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                  />
                  {updatePasswordErrors.password && (
                    <p className="text-sm text-destructive handwritten">{updatePasswordErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-source-serif ink-text">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                  />
                  {updatePasswordErrors.confirmPassword && (
                    <p className="text-sm text-destructive handwritten">{updatePasswordErrors.confirmPassword}</p>
                  )}
                </div>
                <Button type="submit" variant="ink" className="w-full" disabled={isLoading}>
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
                className="mb-2 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="font-source-serif ink-text">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                  />
                  {resetEmailError && (
                    <p className="text-sm text-destructive handwritten">{resetEmailError}</p>
                  )}
                  <p className="text-sm text-[hsl(var(--pencil-gray))] font-source-serif italic">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
                <Button type="submit" variant="ink" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border-2 border-[hsl(var(--pencil-gray))] p-1">
                <TabsTrigger value="signin" className="data-[state=active]:bg-[hsl(var(--highlighter-yellow))]/40 data-[state=active]:text-[hsl(var(--ink-blue))] font-source-serif">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[hsl(var(--highlighter-yellow))]/40 data-[state=active]:text-[hsl(var(--ink-blue))] font-source-serif">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="font-source-serif ink-text">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                    />
                    {signInErrors.email && (
                      <p className="text-sm text-destructive handwritten">{signInErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="font-source-serif ink-text">Password</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowResetPassword(true)}
                        className="h-auto p-0 text-xs text-[hsl(var(--ink-blue))] hover:text-[hsl(var(--ink-blue))]/70"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                    />
                    {signInErrors.password && (
                      <p className="text-sm text-destructive handwritten">{signInErrors.password}</p>
                    )}
                  </div>
                  <Button type="submit" variant="ink" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-source-serif ink-text">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    disabled={isLoading}
                    className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                  />
                  {signUpErrors.fullName && (
                    <p className="text-sm text-destructive handwritten">{signUpErrors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="font-source-serif ink-text">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                  />
                  {signUpErrors.email && (
                    <p className="text-sm text-destructive handwritten">{signUpErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="font-source-serif ink-text">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))] sketch-border"
                  />
                  {signUpErrors.password && (
                    <p className="text-sm text-destructive handwritten">{signUpErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-country" className="font-source-serif ink-text">Country *</Label>
                  <Select
                    value={signUpCountry}
                    onValueChange={setSignUpCountry}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="signup-country" className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))]">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--cream))] border-2 border-[hsl(var(--pencil-gray))] max-h-[300px]">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country} className="font-source-serif">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {signUpErrors.country && (
                    <p className="text-sm text-destructive handwritten">{signUpErrors.country}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-field" className="font-source-serif ink-text">Field of Study *</Label>
                  <Select
                    value={signUpFieldOfStudy}
                    onValueChange={setSignUpFieldOfStudy}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="signup-field" className="bg-[hsl(var(--highlighter-yellow))]/20 border-2 border-[hsl(var(--pencil-gray))] focus:border-[hsl(var(--ink-blue))]">
                      <SelectValue placeholder="Select your field of study" />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--cream))] border-2 border-[hsl(var(--pencil-gray))]">
                      {FIELDS_OF_STUDY.map((field) => (
                        <SelectItem key={field} value={field} className="font-source-serif">
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {signUpErrors.fieldOfStudy && (
                    <p className="text-sm text-destructive handwritten">{signUpErrors.fieldOfStudy}</p>
                  )}
                </div>
                <div className="pt-2 pb-1">
                  <p className="text-xs text-[hsl(var(--pencil-gray))] leading-relaxed font-source-serif">
                    By entering my email address and clicking "Create Account", I agree to BioSketch's{' '}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[hsl(var(--ink-blue))] hover:underline font-medium"
                    >
                      privacy policy and terms of service
                    </a>.
                  </p>
                </div>
                <Button type="submit" variant="sticky" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
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
