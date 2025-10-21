import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Microscope } from 'lucide-react';
import { z } from 'zod';
import { HCaptchaWrapper, HCaptchaHandle } from '@/components/ui/hcaptcha-wrapper';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEO/SEOHead';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional()
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

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
      navigate('/canvas');
      setSignUpCaptchaToken('');
      signUpCaptchaRef.current?.resetCaptcha();
    } else {
      setSignUpCaptchaToken('');
      signUpCaptchaRef.current?.resetCaptcha();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <SEOHead
        title="Sign In - BioSketch"
        description="Sign in to BioSketch to access your scientific illustrations and projects"
        noindex={true}
      />
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary border-[3px] border-foreground neo-brutalist-shadow rotate-3 hover:rotate-6 transition-transform duration-300 inline-block">
              <Microscope className="h-10 w-10 text-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            BioSketch
          </CardTitle>
          <CardDescription className="text-center">
            Create and manage your diagrams
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <Label htmlFor="signin-password">Password</Label>
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
        </CardContent>
      </Card>
    </div>
  );
}
