import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Scale, 
  ImageIcon, 
  Users, 
  Upload, 
  ShieldAlert, 
  AlertTriangle, 
  FlaskConical, 
  Lock, 
  FileText, 
  Ban, 
  Gavel,
  CheckCircle2
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";

interface TermsSectionProps {
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
}

const TermsSection = ({ icon, number, title, children }: TermsSectionProps) => (
  <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
    <CardContent className="p-6 md:p-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex-shrink-0">
          {icon}
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Section {number}</span>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">{title}</h2>
        </div>
      </div>
      <div className="text-muted-foreground leading-relaxed">
        {children}
      </div>
    </CardContent>
  </Card>
);

const Terms = () => {
  const navigate = useNavigate();

  const usageLicenseItems = [
    'Academic research publications',
    'Educational materials and presentations',
    'Scientific documentation and reports',
    'Commercial and non-commercial scientific communication'
  ];

  const iconLibraryItems = [
    'Icons may be used without restriction in your scientific projects',
    'No copyright permission is required for use of these icons',
    'Icons may be modified, adapted, and incorporated into derivative works'
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms and Conditions - BioSketch"
        description="Terms of service and usage guidelines for BioSketch scientific illustration tool. Learn about licensing, usage rights, and community guidelines."
        canonical="https://biosketch.art/terms"
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
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl relative">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <Scale className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Legal</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground mb-6 tracking-tight">
            Terms & Conditions
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            By using BioSketch, you agree to these terms. We've designed them to be fair, 
            transparent, and supportive of the scientific community.
          </p>
          
          <p className="text-sm text-muted-foreground/70">
            Last Updated: January 2025
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          <TermsSection 
            icon={<FlaskConical className="h-5 w-5 text-primary" />}
            number="1"
            title="License and Usage"
          >
            <p className="mb-4">
              BioSketch is provided <span className="font-medium text-foreground">free of charge</span> for use in all scientific projects, including but not limited to:
            </p>
            <ul className="space-y-2">
              {usageLicenseItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </TermsSection>

          <TermsSection 
            icon={<ImageIcon className="h-5 w-5 text-primary" />}
            number="2"
            title="Icon Library"
          >
            <p className="mb-4">
              All icons available in BioSketch are in the <span className="font-medium text-foreground">public domain</span> or provided under open licenses that permit free use:
            </p>
            <ul className="space-y-2 mb-6">
              {iconLibraryItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm">
                <span className="font-semibold text-foreground">Attribution Recommendation:</span> While not legally required, we strongly encourage users to provide attribution to the original authors of icons when possible. Proper attribution supports the scientific community.
              </p>
            </div>
          </TermsSection>

          <TermsSection 
            icon={<FileText className="h-5 w-5 text-primary" />}
            number="3"
            title="User Content"
          >
            <p>
              You retain all rights to the diagrams, projects, and content you create using BioSketch. You are responsible for ensuring that your use of the application and any content you create complies with applicable laws and regulations.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<Upload className="h-5 w-5 text-primary" />}
            number="4"
            title="Community Submissions"
          >
            <p>
              By submitting icons or projects to the BioSketch community library, you grant BioSketch and its users a non-exclusive, worldwide, royalty-free license to use, display, and distribute your submissions. You confirm that you have the right to submit such content.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<ShieldAlert className="h-5 w-5 text-primary" />}
            number="5"
            title="Disclaimer of Warranties"
          >
            <p>
              BioSketch is provided "as is" without any warranties, express or implied. We do not guarantee that the application will be error-free, uninterrupted, or meet your specific requirements. Use of BioSketch is at your own risk.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<AlertTriangle className="h-5 w-5 text-primary" />}
            number="6"
            title="Limitation of Liability"
          >
            <p>
              To the maximum extent permitted by law, BioSketch and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the application.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<FlaskConical className="h-5 w-5 text-primary" />}
            number="7"
            title="Scientific Accuracy"
          >
            <p>
              While BioSketch provides tools for creating scientific diagrams, users are solely responsible for ensuring the scientific accuracy, validity, and appropriateness of their work. BioSketch does not verify or validate the scientific content of user-created diagrams.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<Lock className="h-5 w-5 text-primary" />}
            number="8"
            title="Data and Privacy"
          >
            <p>
              We respect your privacy and handle your data responsibly. Your projects and personal information are stored securely. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<FileText className="h-5 w-5 text-primary" />}
            number="9"
            title="Modifications to Terms"
          >
            <p>
              We reserve the right to modify these terms at any time. Continued use of BioSketch after changes constitutes acceptance of the modified terms. We encourage users to review these terms periodically.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<Ban className="h-5 w-5 text-primary" />}
            number="10"
            title="Account Termination"
          >
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or misuse the application.
            </p>
          </TermsSection>

          <TermsSection 
            icon={<Gavel className="h-5 w-5 text-primary" />}
            number="11"
            title="Governing Law"
          >
            <p>
              These terms shall be governed by and construed in accordance with applicable international laws regarding software use and intellectual property.
            </p>
          </TermsSection>

          {/* Contact Section */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
                Have Questions?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                If you have questions about these terms, please don't hesitate to reach out to our team.
              </p>
              <Button asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Terms;
