import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, User, Globe, MessageSquare } from "lucide-react";
import { z } from "zod";
import { HCaptchaWrapper, HCaptchaHandle } from "@/components/ui/hcaptcha-wrapper";

const contactSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
  fullName: z.string().trim().min(1, { message: "Full name is required" }).max(100),
  country: z.string().trim().min(1, { message: "Country is required" }).max(100),
  message: z.string().trim().min(1, { message: "Message is required" }).max(5000, { message: "Message must be less than 5000 characters" })
});

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    country: "",
    message: ""
  });
  const [wordCount, setWordCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const captchaRef = useRef<HCaptchaHandle>(null);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleMessageChange = (text: string) => {
    const words = countWords(text);
    setWordCount(words);
    setFormData(prev => ({ ...prev, message: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check captcha
    if (!captchaToken) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      return;
    }

    // Check word count
    if (wordCount > 500) {
      setErrors({ message: "Message must not exceed 500 words" });
      return;
    }

    // Validate form data
    try {
      contactSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("contact_messages").insert({
        email: formData.email,
        full_name: formData.fullName,
        country: formData.country,
        message: formData.message,
        user_id: user?.id || null
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      // Reset form
      setFormData({
        email: "",
        fullName: "",
        country: "",
        message: ""
      });
      setWordCount(0);
      setCaptchaToken('');
      captchaRef.current?.resetCaptcha();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setCaptchaToken('');
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-[4px] border-foreground bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => navigate(-1)}
            className="bg-background border-[3px] border-foreground neo-brutalist-shadow font-bold uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary border-[4px] border-foreground -rotate-3">
              <MessageSquare className="h-12 w-12 text-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase">Contact Us</h1>
          </div>
          <p className="text-xl font-bold text-muted-foreground">
            Have a question or feedback? We'd love to hear from you!
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="border-[3px] border-foreground focus:ring-2 focus:ring-primary font-medium"
                required
              />
              {errors.email && (
                <p className="text-sm font-bold text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="John Doe"
                className="border-[3px] border-foreground focus:ring-2 focus:ring-primary font-medium"
                required
              />
              {errors.fullName && (
                <p className="text-sm font-bold text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Country *
              </Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="United States"
                className="border-[3px] border-foreground focus:ring-2 focus:ring-primary font-medium"
                required
              />
              {errors.country && (
                <p className="text-sm font-bold text-destructive">{errors.country}</p>
              )}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-lg font-bold flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message *
                </span>
                <span className={`text-sm ${wordCount > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {wordCount} / 500 words
                </span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={8}
                className="border-[3px] border-foreground focus:ring-2 focus:ring-primary font-medium resize-none"
                required
              />
              {errors.message && (
                <p className="text-sm font-bold text-destructive">{errors.message}</p>
              )}
            </div>

            {/* hCaptcha */}
            <HCaptchaWrapper
              ref={captchaRef}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken('')}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || wordCount > 500}
              className="w-full bg-primary border-[3px] border-foreground neo-brutalist-shadow font-black text-lg uppercase py-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-accent/20 border-[4px] border-foreground neo-brutalist-shadow p-6 text-center">
          <p className="text-base md:text-lg font-bold">
            We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in your message.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;