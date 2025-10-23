import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Microscope, Beaker, FlaskConical, Dna, TestTube, Pill, Syringe, Brain, Heart, Atom, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { HCaptchaWrapper, HCaptchaHandle } from '@/components/ui/hcaptcha-wrapper';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEO/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedProjectShowcase } from '@/components/auth/FeaturedProjectShowcase';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional()
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
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

  // Error states
  const [signInErrors, setSignInErrors] = useState<any>({});
  const [signUpErrors, setSignUpErrors] = useState<any>({});

  // Captcha states
  const [signInCaptchaToken, setSignInCaptchaToken] = useState<string>('');
  const [signUpCaptchaToken, setSignUpCaptchaToken] = useState<string>('');
  const signInCaptchaRef = useRef<HCaptchaHandle>(null);
  const signUpCaptchaRef = useRef<HCaptchaHandle>(null);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    
    if (!signInCaptchaToken) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      return;
    }

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
    } else {
      setSignInCaptchaToken('');
      signInCaptchaRef.current?.resetCaptcha();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});
    
    if (!signUpCaptchaToken) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      return;
    }

    const result = signUpSchema.safeParse({ 
      email: signUpEmail, 
      password: signUpPassword,
      fullName: signUpFullName 
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
    const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName);
    setIsLoading(false);

    if (!error) {
      setActiveTab('signin');
      setSignUpCaptchaToken('');
      signUpCaptchaRef.current?.resetCaptcha();
    } else {
      setSignUpCaptchaToken('');
      signUpCaptchaRef.current?.resetCaptcha();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden grid-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden grid-background p-4 lg:p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl float-animation" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl float-animation [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-accent/10 rounded-full blur-3xl float-animation [animation-delay:4s]" />
        
        {/* Floating Lab Icons */}
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
              className={`floating-icon ${config.speed}`}
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
        <Card className="w-full lg:flex-1 lg:max-w-md backdrop-blur-sm bg-card/80 border-border shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            BioSketch
          </CardTitle>
          <CardDescription className="text-center">
            {showResetPassword ? 'Reset your password' : 'Create and manage your diagrams'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetPassword ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetEmail('');
                  setResetEmailError('');
                }}
                className="mb-2"
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
                  />
                  {resetEmailError && (
                    <p className="text-sm text-destructive">{resetEmailError}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
                    />
                    {signInErrors.email && (
                      <p className="text-sm text-destructive">{signInErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowResetPassword(true)}
                        className="h-auto p-0 text-xs"
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
                    />
                    {signInErrors.password && (
                      <p className="text-sm text-destructive">{signInErrors.password}</p>
                    )}
                  </div>
                  <HCaptchaWrapper
                    ref={signInCaptchaRef}
                    onVerify={(token) => setSignInCaptchaToken(token)}
                    onExpire={() => setSignInCaptchaToken('')}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
                    placeholder="John Doe"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    disabled={isLoading}
                  />
                  {signUpErrors.fullName && (
                    <p className="text-sm text-destructive">{signUpErrors.fullName}</p>
                  )}
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
                  />
                  {signUpErrors.email && (
                    <p className="text-sm text-destructive">{signUpErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {signUpErrors.password && (
                    <p className="text-sm text-destructive">{signUpErrors.password}</p>
                  )}
                </div>
                <HCaptchaWrapper
                  ref={signUpCaptchaRef}
                  onVerify={(token) => setSignUpCaptchaToken(token)}
                  onExpire={() => setSignUpCaptchaToken('')}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
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
