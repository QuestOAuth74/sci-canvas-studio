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
import { HCaptchaWrapper, HCaptchaHandle } from "@/components/ui/hcaptcha-wrapper";

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
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const captchaRef = useRef<HCaptchaHandle>(null);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    fetchTestimonials(currentPage);
  }, [currentPage]);

  const fetchTestimonials = async (page: number) => {
    // Get total count
    const { count } = await supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", true);

    if (count) {
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    }

    // Get paginated data
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

    if (!captchaToken) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      return;
    }

    // Validate form data
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
      setCaptchaToken('');
      captchaRef.current?.resetCaptcha();
      
      toast({
        title: "Thank you! 🎉",
        description: "Your kind words mean a lot! We'll review and publish your testimonial soon.",
      });

      // Scroll to testimonials section after a brief delay
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
      setCaptchaToken('');
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="absolute top-0 right-0 p-4 z-20">
        <UserMenu />
      </header>

      {/* Neo-brutalist grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 font-bold uppercase"
            >
              ← Back to Home
            </Button>
            
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-accent border-[3px] border-foreground neo-brutalist-shadow-sm font-bold text-sm uppercase">
              <MessageCircleHeart className="h-4 w-4" />
              <span>Community Love</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              Leave a Kind Word
            </h1>
            
            <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
              Your feedback helps us grow and motivates us to keep BioSketch free for the scientific community.
            </p>
          </div>

          {/* Form Section */}
          {showForm && !submitted && (
            <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-8 md:p-10 max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-bold uppercase">
                    Your Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 border-[3px] border-foreground focus:ring-0 focus:border-primary font-medium"
                    placeholder="Dr. Jane Smith"
                  />
                  {errors.name && <p className="text-destructive text-sm font-medium">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-base font-bold uppercase flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country *
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="h-12 border-[3px] border-foreground focus:ring-0 focus:border-primary font-medium"
                    placeholder="United States"
                  />
                  {errors.country && <p className="text-destructive text-sm font-medium">{errors.country}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discipline" className="text-base font-bold uppercase flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Scientific Discipline *
                  </Label>
                  <Input
                    id="discipline"
                    value={formData.scientific_discipline}
                    onChange={(e) => setFormData({ ...formData, scientific_discipline: e.target.value })}
                    className="h-12 border-[3px] border-foreground focus:ring-0 focus:border-primary font-medium"
                    placeholder="Molecular Biology"
                  />
                  {errors.scientific_discipline && <p className="text-destructive text-sm font-medium">{errors.scientific_discipline}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold uppercase flex items-center gap-2">
                    <Star className="h-4 w-4 fill-primary" />
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
                              ? "fill-primary text-primary"
                              : "fill-none text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-bold uppercase flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Your Message * <span className="text-xs font-normal opacity-70">(10-500 characters)</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-[150px] border-[3px] border-foreground focus:ring-0 focus:border-primary font-medium resize-none"
                    placeholder="Share what you love about BioSketch..."
                  />
                  <div className="flex justify-between items-center">
                    {errors.message && <p className="text-destructive text-sm font-medium">{errors.message}</p>}
                    <p className="text-xs font-medium opacity-70 ml-auto">
                      {formData.message.length}/500
                    </p>
                  </div>
                </div>

                <HCaptchaWrapper
                  ref={captchaRef}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken('')}
                />

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-14 text-base font-bold uppercase bg-primary hover:bg-primary border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none"
                >
                  {isSubmitting ? "Submitting..." : "Submit Your Kind Words"}
                  <MessageCircleHeart className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>
          )}

          {/* Success Message */}
          {submitted && !showForm && (
            <div className="bg-accent border-[4px] border-foreground neo-brutalist-shadow p-8 md:p-10 max-w-3xl mx-auto text-center space-y-6 animate-scale-in">
              <div className="w-20 h-20 bg-primary border-[4px] border-foreground rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-foreground" />
              </div>
              <h2 className="text-3xl font-black uppercase">Thank You!</h2>
              <p className="text-lg font-medium">
                Your testimonial has been submitted and will appear below after review. We appreciate your support! ❤️
              </p>
              <Button
                size="lg"
                onClick={() => {
                  setSubmitted(false);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="h-12 px-8 font-bold uppercase bg-secondary hover:bg-secondary/80 border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none"
              >
                Submit Another
              </Button>
            </div>
          )}

          {/* Testimonials Display */}
          {testimonials.length > 0 && (
            <div id="testimonials-section" className="space-y-8 scroll-mt-20">
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
                  What Scientists Say
                </h2>
                <p className="text-lg font-medium opacity-80">
                  Real feedback from our amazing community
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`bg-card border-[3px] border-foreground neo-brutalist-shadow p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-300 ${
                      index % 3 === 0 ? 'rotate-0' : index % 3 === 1 ? 'rotate-0' : 'rotate-0'
                    } animate-fade-in`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-muted border-[2px] border-foreground rounded-full flex-shrink-0">
                        <User className="h-6 w-6 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base">{testimonial.name}</h3>
                        <p className="text-xs font-medium opacity-70 truncate">
                          {testimonial.scientific_discipline}
                        </p>
                        <p className="text-xs font-medium opacity-60 flex items-center gap-1">
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
                              ? "fill-primary text-primary"
                              : "fill-none text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                      "{testimonial.message}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-12 px-6 font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`h-12 w-12 font-bold border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${
                          currentPage === page ? "bg-primary" : ""
                        }`}
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
                    className="h-12 px-6 font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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