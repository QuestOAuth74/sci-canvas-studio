import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, MessageCircleHeart, Globe, Sparkles, CheckCircle, Star, User, ChevronLeft, ChevronRight } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

import { SEOHead } from "@/components/SEO/SEOHead";

const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  country: z.string().trim().min(2, "Country is required").max(100, "Country must be less than 100 characters"),
  scientific_discipline: z.string().trim().min(2, "Scientific discipline is required").max(100, "Please enter a shorter discipline name"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(500, "Message must be less than 500 characters"),
  rating: z.number().min(1).max(5),
});

interface Testimonial {
  id: string;
  name: string;
  country: string;
  scientific_discipline: string;
  message: string;
  created_at: string;
  rating: number;
}

const Testimonials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    scientific_discipline: "",
    message: "",
    rating: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(true);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    fetchTestimonials(currentPage);
  }, [currentPage]);

  const fetchTestimonials = async (page: number) => {
    const { count } = await supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", true);

    if (count) {
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setTestimonials(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = testimonialSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("testimonials").insert({
        ...formData,
        user_id: user?.id || null,
      });

      if (error) throw error;

      setSubmitted(true);
      setShowForm(false);
      setFormData({ name: "", country: "", scientific_discipline: "", message: "", rating: 5 });
      
      toast({
        title: "Thank you! 🎉",
        description: "Your kind words mean a lot! We'll review and publish your testimonial soon.",
      });

      setTimeout(() => {
        setCurrentPage(1);
        document.getElementById("testimonials-section")?.scrollIntoView({ 
          behavior: "smooth",
          block: "start"
        });
      }, 500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oops!",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen notebook-page ruled-lines relative">
      <SEOHead
        title="Testimonials - BioSketch"
        description="What scientists and researchers say about BioSketch. Read reviews from our community of users who create scientific illustrations with BioSketch."
        canonical="https://biosketch.art/testimonials"
      />
      
      {/* Margin line decoration */}
      <div className="margin-line" />
      
      <header className="absolute top-0 right-0 p-4 z-20">
        <UserMenu />
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 pencil-button"
            >
              ← Back to Home
            </Button>
            
            <div className="sticky-note inline-block rotate-[-1deg] shadow-none">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MessageCircleHeart className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                <span className="font-['Caveat'] text-xl text-[hsl(var(--ink-blue))]">Community Love</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-['Caveat'] tracking-tight text-[hsl(var(--ink-blue))] mb-4">
                Leave a Kind Word
              </h1>
              
              <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
                Your feedback helps us grow and motivates us to keep BioSketch free for the scientific community.
              </p>
            </div>
          </div>

          {showForm && !submitted && (
            <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-8 md:p-10 max-w-3xl mx-auto relative">
              {/* Decorative washi tape */}
              <div className="absolute -top-3 left-12 w-24 h-6 bg-[hsl(var(--highlighter-yellow))]/50 rotate-[-2deg] border border-[hsl(var(--pencil-gray))]/30" />
              <div className="absolute -top-3 right-12 w-24 h-6 bg-[hsl(var(--highlighter-yellow))]/50 rotate-[2deg] border border-[hsl(var(--pencil-gray))]/30" />
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-['Caveat'] text-xl text-[hsl(var(--ink-blue))]">Your Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch"
                    placeholder="Dr. Jane Smith"
                  />
                  {errors.name && <p className="text-destructive text-sm font-source-serif">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-base font-['Caveat'] text-xl text-[hsl(var(--ink-blue))] flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country *
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="h-12 border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch"
                    placeholder="United States"
                  />
                  {errors.country && <p className="text-destructive text-sm font-source-serif">{errors.country}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discipline" className="text-base font-['Caveat'] text-xl text-[hsl(var(--ink-blue))] flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Scientific Discipline *
                  </Label>
                  <Input
                    id="discipline"
                    value={formData.scientific_discipline}
                    onChange={(e) => setFormData({ ...formData, scientific_discipline: e.target.value })}
                    className="h-12 border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch"
                    placeholder="Molecular Biology"
                  />
                  {errors.scientific_discipline && <p className="text-destructive text-sm font-source-serif">{errors.scientific_discipline}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-['Caveat'] text-xl text-[hsl(var(--ink-blue))] flex items-center gap-2">
                    <Star className="h-4 w-4 fill-[hsl(var(--ink-blue))]" />
                    Your Rating *
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-10 w-10 ${
                            star <= formData.rating
                              ? "fill-[hsl(var(--ink-blue))] text-[hsl(var(--ink-blue))]"
                              : "fill-none text-[hsl(var(--pencil-gray))]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-['Caveat'] text-xl text-[hsl(var(--ink-blue))] flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Your Message * <span className="text-xs font-source-serif font-normal text-[hsl(var(--pencil-gray))]">(10-500 characters)</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-[150px] resize-none border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/10 font-source-serif pencil-sketch"
                    placeholder="Share what you love about BioSketch..."
                  />
                  <div className="flex justify-between items-center">
                    {errors.message && <p className="text-destructive text-sm font-source-serif">{errors.message}</p>}
                    <p className="text-xs text-[hsl(var(--pencil-gray))] ml-auto font-source-serif">
                      {formData.message.length}/500
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-14 text-base pencil-button font-['Caveat'] text-xl"
                >
                  {isSubmitting ? "Submitting..." : "Share Your Experience"}
                  <MessageCircleHeart className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>
          )}

          {submitted && !showForm && (
            <div className="sticky-note p-8 md:p-10 max-w-3xl mx-auto text-center space-y-6 animate-scale-in rotate-[-0.5deg] shadow-none">
              <div className="w-20 h-20 bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">Thank You!</h2>
              <p className="text-lg font-source-serif text-[hsl(var(--pencil-gray))]">
                Your testimonial has been submitted and will appear below after review. We appreciate your support! ❤️
              </p>
              <Button
                size="lg"
                onClick={() => {
                  setSubmitted(false);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                variant="secondary"
                className="pencil-button font-['Caveat'] text-lg"
              >
                Submit Another
              </Button>
            </div>
          )}

          {testimonials.length > 0 && (
            <div id="testimonials-section" className="space-y-8 scroll-mt-20">
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-['Caveat'] mb-4 text-[hsl(var(--ink-blue))]">
                  What Scientists Say
                </h2>
                <p className="text-lg font-source-serif text-[hsl(var(--pencil-gray))]">
                  Real feedback from our amazing community
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => {
                  const rotations = [-1, 0.5, -0.5, 1, -0.7, 0.7];
                  const rotation = rotations[index % rotations.length];
                  
                  return (
                    <div
                      key={testimonial.id}
                      className="sticky-note hover:scale-[1.02] transition-all animate-fade-in shadow-none"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        transform: `rotate(${rotation}deg)`
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-['Caveat'] text-xl text-[hsl(var(--ink-blue))]">{testimonial.name}</h3>
                          <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] truncate">
                            {testimonial.scientific_discipline}
                          </p>
                          <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {testimonial.country}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= testimonial.rating
                                ? "fill-[hsl(var(--ink-blue))] text-[hsl(var(--ink-blue))]"
                                : "fill-none text-[hsl(var(--pencil-gray))]"
                            }`}
                          />
                        ))}
                      </div>
                      
                      <p className="text-sm leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))] italic">
                        "{testimonial.message}"
                      </p>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pencil-button font-source-serif"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="lg"
                        onClick={() => setCurrentPage(page)}
                        className={`h-12 w-12 font-source-serif ${currentPage === page ? "bg-[hsl(var(--ink-blue))] text-white" : "pencil-button"}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pencil-button font-source-serif"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
