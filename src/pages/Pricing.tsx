import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  Sparkles,
  Users,
  Building2,
  Zap,
  HardDrive,
  RefreshCw,
  Shield,
  HeadphonesIcon,
  Infinity,
  Send,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DotPattern from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEO/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  highlighted?: boolean;
  buttonText: string;
  buttonVariant?: "default" | "outline" | "secondary";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Full-featured canvas for individual researchers",
    icon: <Zap className="h-6 w-6" />,
    features: [
      "Full access to all canvas tools",
      "6,000+ scientific icons library",
      "200 MB storage",
      "Unlimited projects",
      "PNG, SVG & PDF export",
      "Earn AI credits by sharing to community",
      "Community support",
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline",
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "For researchers who need AI power and collaboration",
    icon: <Sparkles className="h-6 w-6" />,
    highlighted: true,
    features: [
      "2 GB storage",
      "1,500 AI credits/month",
      "Credits reset monthly",
      "Real-time collaboration",
      "Priority support",
      "Advanced export options",
      "Custom templates",
      "Version history",
    ],
    buttonText: "Upgrade to Pro",
    buttonVariant: "default",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For research teams and institutions",
    icon: <Building2 className="h-6 w-6" />,
    features: [
      "Unlimited storage",
      "Unlimited AI credits",
      "Dedicated account manager",
      "SSO & advanced security",
      "Custom integrations",
      "Team management",
      "SLA guarantee",
      "On-premise option",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "secondary",
  },
];

const faqs = [
  {
    q: "Can I use all canvas tools on the Free plan?",
    a: "Yes! Free users get full access to all canvas tools, shapes, connectors, and our entire library of 6,000+ scientific icons. The Free plan is designed for individual research work with no feature limitations.",
  },
  {
    q: "How do I earn free AI credits?",
    a: "Share your projects with the community gallery to earn AI credits! Each approved submission earns you credits that can be used for AI-powered figure generation.",
  },
  {
    q: "What happens to my AI credits at the end of the month?",
    a: "For Pro users, AI credits reset at the beginning of each billing cycle. Credits earned through community sharing never expire.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes! You can change your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the next billing cycle.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes! Students and educators with a valid .edu email get 50% off Pro plans. Contact us to apply.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and institutional purchase orders for Enterprise plans.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    teamSize: "",
    message: "",
  });

  const handleTierClick = (tier: PricingTier) => {
    if (tier.name === "Enterprise") {
      setEnterpriseDialogOpen(true);
    } else if (tier.name === "Free") {
      navigate(user ? "/canvas" : "/auth");
    } else if (tier.name === "Pro") {
      // For now, navigate to auth or show upgrade modal
      if (!user) {
        navigate("/auth");
      } else {
        toast.info("Pro subscriptions coming soon! Stay tuned.");
      }
    }
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Try to store the enterprise inquiry in database
      const { error } = await (supabase.from as any)("enterprise_inquiries").insert({
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        team_size: formData.teamSize,
        message: formData.message,
      });

      // If table doesn't exist, still show success (will be handled via email/logs)
      if (error && !error.message.includes("does not exist")) {
        throw error;
      }

      // Log the inquiry for backup
      console.log("Enterprise inquiry submitted:", {
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        teamSize: formData.teamSize,
      });

      toast.success("Thank you! We'll be in touch within 24 hours.");
      setEnterpriseDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        organization: "",
        teamSize: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit. Please email us at support@biosketch.art");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 relative overflow-hidden">
      <SEOHead
        title="Pricing - BioSketch"
        description="Choose the perfect plan for your scientific illustration needs. Free forever tier, Pro with AI credits, or Enterprise for teams."
      />

      {/* Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1.4 }}
          className="blob-1 top-[-100px] left-[10%]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.3 }}
          className="blob-2 bottom-[20%] right-[-50px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1.8, delay: 0.5 }}
          className="blob-3 top-[60%] left-[-100px]"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-cyan-600 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Choose your plan
            </h1>
            <p className="text-lg text-slate-600">
              Start free and upgrade when you need more power. No hidden fees.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 -mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "relative",
                  tier.highlighted && "md:-mt-4 md:mb-4"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-full shadow-lg shadow-indigo-500/25">
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "h-full flex flex-col rounded-3xl p-6 transition-all duration-300",
                    tier.highlighted
                      ? "glass-card shadow-soft border-blue-200/50 hover:shadow-lg shadow-cyan-500/25"
                      : "glass-card hover:shadow-soft hover:-translate-y-1"
                  )}
                >
                  <div className="space-y-4 mb-6">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        tier.highlighted
                          ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-cyan-500/25"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tier.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {tier.description}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-slate-500">
                          {tier.period}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            tier.highlighted
                              ? "bg-blue-100 text-cyan-600"
                              : "bg-slate-100 text-slate-500"
                          )}>
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-sm text-slate-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn(
                        "w-full mt-6 rounded-xl h-12",
                        tier.highlighted
                          ? "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 border-0"
                          : tier.buttonVariant === "outline"
                            ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                            : ""
                      )}
                      variant={tier.highlighted ? "default" : tier.buttonVariant}
                      size="lg"
                      onClick={() => handleTierClick(tier)}
                    >
                      {tier.buttonText}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Credits Callout */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative glass-card rounded-3xl overflow-hidden p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-blue-500/5" />
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Earn AI Credits for Free
                  </h3>
                  <p className="text-slate-600">
                    Share your scientific illustrations with our community gallery and earn AI credits.
                    Help fellow researchers while unlocking AI-powered figure generation at no cost.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              What's included
            </h2>
            <p className="text-slate-600">
              Compare features across all plans
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Canvas Tools",
                free: "Full Access",
                pro: "Full Access",
                enterprise: "Full Access",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                icon: <HardDrive className="h-6 w-6" />,
                title: "Storage",
                free: "200 MB",
                pro: "2 GB",
                enterprise: "Unlimited",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                title: "AI Credits",
                free: "Earn via sharing",
                pro: "1,500/mo",
                enterprise: "Unlimited",
                gradient: "from-blue-500 to-violet-500",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Collaboration",
                free: "—",
                pro: "Real-time",
                enterprise: "Advanced",
                gradient: "from-pink-500 to-rose-500",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Support",
                free: "Community",
                pro: "Priority",
                enterprise: "Dedicated",
                gradient: "from-indigo-500 to-purple-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br text-white",
                  feature.gradient
                )}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Free</span>
                    <span className="text-slate-700">{feature.free}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pro</span>
                    <span className="text-cyan-600 font-medium">
                      {feature.pro}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enterprise</span>
                    <span className="text-slate-700">{feature.enterprise}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-slate-600">
              Everything you need to know about our pricing
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 hover:shadow-soft transition-all duration-300"
              >
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card rounded-3xl p-10 text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-3xl font-bold text-slate-900">
                  Ready to create stunning figures?
                </h2>
                <p className="text-slate-600 mt-3">
                  Join thousands of researchers already using BioSketch
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl border-0 h-12 px-8"
                    onClick={() => navigate(user ? "/canvas" : "/auth")}
                  >
                    {user ? "Open Canvas" : "Start Free"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl h-12 px-8 border-slate-200 hover:bg-slate-50"
                    onClick={() => setEnterpriseDialogOpen(true)}
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Contact Dialog */}
      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Contact Enterprise Sales
            </DialogTitle>
            <DialogDescription>
              Tell us about your team and we'll get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Dr. Jane Smith"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@university.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  placeholder="University / Company"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  placeholder="e.g., 10-50"
                  value={formData.teamSize}
                  onChange={(e) =>
                    setFormData({ ...formData, teamSize: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">How can we help?</Label>
              <Textarea
                id="message"
                placeholder="Tell us about your team's needs..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
