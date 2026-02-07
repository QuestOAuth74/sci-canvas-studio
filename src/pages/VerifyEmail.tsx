import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers';
import { SEOHead } from '@/components/SEO/SEOHead';
import { VerifyEmailTestIds, ToastTestIds } from '@/lib/test-ids';
import { motion } from 'framer-motion';
import DotPattern from '@/components/ui/dot-pattern';
import { cn } from '@/lib/utils';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const email = sessionStorage.getItem('verifyEmail') || '';
  const isResent = searchParams.get('resent') === 'true';

  const handleResend = async () => {
    if (!email) {
      showErrorToast("Email address not found. Please try signing up again.", ToastTestIds.VERIFY_EMAIL_RESEND_ERROR);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    setIsLoading(false);

    if (error) {
      showErrorToast(error.message, ToastTestIds.VERIFY_EMAIL_RESEND_ERROR);
    } else {
      showSuccessToast("Verification email sent! Check your inbox.", ToastTestIds.VERIFY_EMAIL_RESEND_SUCCESS);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <SEOHead
        title="Verify Email - BioSketch"
        description="Verify your email address to complete your BioSketch registration"
        noindex={true}
      />

      {/* Background Pattern */}
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(30vw_circle_at_center,white,transparent)]",
          "opacity-40"
        )}
      />

      {/* Animated Gradient Blurs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1.4 }}
        className="absolute top-20 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.3 }}
        className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="w-full border border-border shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold text-foreground" data-testid={VerifyEmailTestIds.HEADING}>
            Check Your Email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isResent
              ? "We've sent another verification link to:"
              : "We sent a verification link to:"}
          </CardDescription>
          {email && (
            <p className="font-semibold text-primary" data-testid={VerifyEmailTestIds.EMAIL_DISPLAY}>
              {email}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground" data-testid={VerifyEmailTestIds.VERIFICATION_MESSAGE}>
            Click the link in the email to verify your account and start creating scientific illustrations.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isLoading || !email}
            data-testid={VerifyEmailTestIds.RESEND_BUTTON}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend verification email
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => navigate('/auth')}
            data-testid={VerifyEmailTestIds.BACK_TO_SIGNIN_BUTTON}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}