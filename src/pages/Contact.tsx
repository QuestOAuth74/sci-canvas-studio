import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, User, Globe, MessageSquare, Clock, Send, MapPin, AtSign } from "lucide-react";
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

    if (wordCount > 500) {
      setErrors({ message: "Message must not exceed 500 words" });
      return;
    }

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
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us - BioSketch"
        description="Get in touch with the BioSketch team. Send us your questions, feedback, or suggestions for improving our scientific illustration tool."
        canonical="https://biosketch.art/contact"
      />
      
      {/* Subtle dot pattern background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl relative">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Get in Touch</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground mb-6 tracking-tight">
            Contact Us
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have a question, feedback, or suggestion? We'd love to hear from you. 
            Our team is here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Response Time</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We typically respond within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <AtSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      For urgent matters, include "URGENT" in your message subject.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Global Community</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Serving researchers and scientists worldwide from all disciplines.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
                    Send us a Message
                  </h2>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        className="border-border/60 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    {/* Full Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="John Doe"
                        className="border-border/60 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                        required
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  </div>

                  {/* Country Field */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Country / Region
                    </Label>
                    <Input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="United States"
                      className="border-border/60 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                      required
                    />
                    {errors.country && (
                      <p className="text-sm text-destructive">{errors.country}</p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Your Message
                      </Label>
                      <span className={`text-xs ${wordCount > 500 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {wordCount} / 500 words
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      placeholder="Tell us what's on your mind. We're here to help with any questions about BioSketch, feature requests, or general feedback..."
                      rows={6}
                      className="resize-none border-border/60 bg-background/50 focus:bg-background focus:border-primary/50 transition-all"
                      required
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || wordCount > 500}
                    size="lg"
                    className="w-full md:w-auto px-8 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;