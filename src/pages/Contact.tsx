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

import { SEOHead } from "@/components/SEO/SEOHead";

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
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen notebook-page ruled-lines">
      <SEOHead
        title="Contact Us - BioSketch"
        description="Get in touch with the BioSketch team. Send us your questions, feedback, or suggestions for improving our scientific illustration tool."
        canonical="https://biosketch.art/contact"
      />
      
      {/* Margin line decoration */}
      <div className="margin-line" />
      
      {/* Header */}
      <div className="border-b-2 border-[hsl(var(--pencil-gray))] bg-[#f9f6f0] paper-shadow">
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="pencil-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Title Section - Sticky Note Style */}
        <div className="mb-12 text-center">
          <div className="sticky-note inline-block max-w-2xl mx-auto rotate-[-0.5deg] shadow-none">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-4 bg-[hsl(var(--ink-blue))]/10 rounded-full border-2 border-[hsl(var(--ink-blue))]/20">
                <MessageSquare className="h-10 w-10 text-[hsl(var(--ink-blue))]" />
              </div>
              <h1 className="text-5xl md:text-6xl font-['Caveat'] text-[hsl(var(--ink-blue))]">Contact Us</h1>
            </div>
            <p className="text-xl font-source-serif text-[hsl(var(--pencil-gray))]">
              ~ Have a question or feedback? We'd love to hear from you! ~
            </p>
          </div>
        </div>

        {/* Form Card - Notebook Paper */}
        <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-10 relative">
          {/* Decorative washi tape */}
          <div className="absolute -top-3 left-12 w-20 h-6 bg-[hsl(var(--highlighter-yellow))]/50 rotate-[-2deg] border border-[hsl(var(--pencil-gray))]/30" />
          <div className="absolute -top-3 right-12 w-20 h-6 bg-[hsl(var(--highlighter-yellow))]/50 rotate-[2deg] border border-[hsl(var(--pencil-gray))]/30" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-['Caveat'] text-[hsl(var(--ink-blue))] flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch transition-colors"
                required
              />
              {errors.email && (
                <p className="text-sm font-source-serif text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-lg font-['Caveat'] text-[hsl(var(--ink-blue))] flex items-center gap-2">
                <User className="h-5 w-5" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="John Doe"
                className="border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch transition-colors"
                required
              />
              {errors.fullName && (
                <p className="text-sm font-source-serif text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-lg font-['Caveat'] text-[hsl(var(--ink-blue))] flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Country *
              </Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="United States"
                className="border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch transition-colors"
                required
              />
              {errors.country && (
                <p className="text-sm font-source-serif text-destructive">{errors.country}</p>
              )}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-lg font-['Caveat'] text-[hsl(var(--ink-blue))] flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message *
                </span>
                <span className={`text-sm font-source-serif ${wordCount > 500 ? 'text-destructive' : 'text-[hsl(var(--pencil-gray))]/70'}`}>
                  {wordCount} / 500 words
                </span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={8}
                className="resize-none border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch transition-colors"
                required
              />
              {errors.message && (
                <p className="text-sm font-source-serif text-destructive">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || wordCount > 500}
              size="lg"
              className="w-full text-lg py-6 pencil-button font-['Caveat'] text-xl"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>

        {/* Info Section - Sticky Note */}
        <div className="mt-8 sticky-note inline-block w-full max-w-2xl mx-auto rotate-[0.5deg] shadow-none">
          <p className="text-base md:text-lg font-source-serif text-[hsl(var(--pencil-gray))]">
            <span className="font-['Caveat'] text-xl text-[hsl(var(--ink-blue))]">Quick tip:</span> We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in your message.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;