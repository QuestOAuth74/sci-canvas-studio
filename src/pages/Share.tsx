import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Share2, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

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
  const [formData, setFormData] = useState({
    senderName: user?.user_metadata?.full_name || '',
    recipientName: '',
    recipientEmail: '',
    personalMessage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        personalMessage: '',
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('Error sharing:', error);
        toast.error('An error occurred. Please try again.');
      }
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
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <Share2 className="h-8 w-8" />
              <CardTitle className="text-3xl">Share BioSketch</CardTitle>
            </div>
            <CardDescription className="text-base">
              We're not soliciting donations at this time. The best way to support BioSketch 
              is by sharing it with colleagues, students, and others who might benefit from 
              free scientific illustration tools.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-primary/10 border-2 border-primary p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Share via Email
              </h3>
              <p className="text-sm text-muted-foreground">
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

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">What will they receive?</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>An introduction from you (if you add a personal message)</li>
                <li>Information about BioSketch's drag-and-drop interface</li>
                <li>Details about the extensive scientific icon library</li>
                <li>Professional export capabilities for publications</li>
                <li>Emphasis that it's completely free and open-source</li>
                <li>A direct link to start creating</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
