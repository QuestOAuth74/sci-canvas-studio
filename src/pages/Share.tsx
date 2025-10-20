import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Share2, Mail, Loader2, Palette, MousePointer2, Download, Cloud, Sparkles, CheckCircle2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { HCaptchaWrapper, HCaptchaHandle } from '@/components/ui/hcaptcha-wrapper';

const shareSchema = z.object({
  senderName: z.string().max(100, 'Name must be less than 100 characters').optional(),
  recipientName: z.string().min(2, 'Recipient name is required').max(100, 'Name must be less than 100 characters'),
  recipientEmail: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  personalMessage: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

export default function Share() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const captchaRef = useRef<HCaptchaHandle>(null);
  const [formData, setFormData] = useState({
    senderName: user?.user_metadata?.full_name || '',
    recipientName: '',
    recipientEmail: '',
    personalMessage: "I've been using BioSketch for my scientific illustrations and thought you might find it useful too! It's completely free and has made creating diagrams so much easier.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast.error('Please complete the captcha verification');
      return;
    }

    try {
      // Validate form data
      const validatedData = shareSchema.parse(formData);
      
      setIsSubmitting(true);

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-share-email', {
        body: {
          senderName: validatedData.senderName || 'A BioSketch User',
          recipientName: validatedData.recipientName,
          recipientEmail: validatedData.recipientEmail,
          personalMessage: validatedData.personalMessage || '',
        },
      });

      if (error) {
        console.error('Error sending share email:', error);
        toast.error('Failed to send email. Please try again.');
        return;
      }

      toast.success(`BioSketch shared successfully with ${validatedData.recipientName}!`);
      
      // Reset form
      setFormData({
        senderName: user?.user_metadata?.full_name || '',
        recipientName: '',
        recipientEmail: '',
        personalMessage: "I've been using BioSketch for my scientific illustrations and thought you might find it useful too! It's completely free and has made creating diagrams so much easier.",
      });
      setCaptchaToken('');
      captchaRef.current?.resetCaptcha();

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('Error sharing:', error);
        toast.error('An error occurred. Please try again.');
      }
      setCaptchaToken('');
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 font-bold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-4 border-border neo-brutalist-shadow-lg">
          <CardHeader className="space-y-4 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary border-4 border-border neo-brutalist-shadow">
                <Heart className="h-8 w-8 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-4xl flex items-center gap-2">
                  Share BioSketch
                  <Sparkles className="h-6 w-6 text-secondary" />
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-accent border-4 border-border neo-brutalist-shadow p-5">
              <h3 className="font-black text-xl mb-2 flex items-center gap-2 uppercase">
                <div className="p-2 bg-background border-2 border-border">
                  <Mail className="h-5 w-5" />
                </div>
                Share via Email
              </h3>
              <p className="text-sm font-semibold text-foreground/80">
                Enter the details below and we'll send an email introducing BioSketch 
                to your designated person with information about its features.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Your Name (Optional)</Label>
                <Input
                  id="senderName"
                  placeholder="Your name"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient's Name *</Label>
                <Input
                  id="recipientName"
                  placeholder="Who do you want to share BioSketch with?"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient's Email *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="their.email@example.com"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                <Textarea
                  id="personalMessage"
                  placeholder="Add a personal note about why you think they'd enjoy BioSketch..."
                  value={formData.personalMessage}
                  onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.personalMessage.length}/500 characters
                </p>
              </div>

              <HCaptchaWrapper
                ref={captchaRef}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5 mr-2" />
                    Share BioSketch
                  </>
                )}
              </Button>
            </form>

            <div className="bg-secondary border-4 border-border neo-brutalist-shadow p-6">
              <h4 className="font-black text-xl mb-4 uppercase flex items-center gap-2 text-secondary-foreground">
                <CheckCircle2 className="h-6 w-6" />
                What will they receive?
              </h4>
              <ul className="space-y-3 text-secondary-foreground">
                <li className="flex items-start gap-3 font-semibold">
                  <div className="p-1.5 bg-primary border-2 border-border flex-shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-foreground" />
                  </div>
                  <span>Your personal message introducing BioSketch</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="p-1.5 bg-primary border-2 border-border flex-shrink-0 mt-0.5">
                    <MousePointer2 className="h-4 w-4 text-foreground" />
                  </div>
                  <span>Overview of the intuitive drag-and-drop canvas</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="p-1.5 bg-primary border-2 border-border flex-shrink-0 mt-0.5">
                    <Palette className="h-4 w-4 text-foreground" />
                  </div>
                  <span>Hundreds of scientific icons across biology, chemistry, and more</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="p-1.5 bg-primary border-2 border-border flex-shrink-0 mt-0.5">
                    <Download className="h-4 w-4 text-foreground" />
                  </div>
                  <span>Export options for high-quality PNG and SVG files</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="p-1.5 bg-primary border-2 border-border flex-shrink-0 mt-0.5">
                    <Cloud className="h-4 w-4 text-foreground" />
                  </div>
                  <span>Cloud save feature to access projects from anywhere</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="p-1.5 bg-primary border-2 border-border flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-foreground" />
                  </div>
                  <span>Direct link to start creating immediately—100% free, no signup required</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
