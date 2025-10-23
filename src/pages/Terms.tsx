import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Gavel 
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEOHead
        title="Terms and Conditions - BioSketch"
        description="Terms of service and usage guidelines for BioSketch scientific illustration tool. Learn about licensing, usage rights, and community guidelines."
        canonical="https://biosketch.art/terms"
      />
      {/* Header */}
      <div className="border-b glass-effect sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl scientific-shadow">
              <Scale className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">Terms & Conditions</h1>
          </div>
          <p className="text-xl text-muted-foreground">Last Updated: January 2025</p>
        </div>

        {/* Intro Card */}
        <div className="scientific-card p-8 mb-8 bg-gradient-to-br from-accent/10 to-primary/10">
          <p className="text-lg leading-relaxed">
            Welcome to BioSketch! By using our application, you agree to these terms and conditions. 
            We've designed these terms to be fair, transparent, and supportive of the scientific community.
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">1. License and Usage</h2>
            </div>
            <p className="text-base md:text-lg mb-4 leading-relaxed text-muted-foreground">
              BioSketch is provided <span className="font-semibold text-primary">free of charge</span> for use in all scientific projects, including but not limited to:
            </p>
            <ul className="space-y-2 ml-8">
              {['Academic research publications', 'Educational materials and presentations', 'Scientific documentation and reports', 'Non-commercial scientific communication'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg">
                  <span className="text-primary font-semibold text-xl">•</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary/10 rounded-xl flex-shrink-0">
                <ImageIcon className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">2. Icon Library</h2>
            </div>
            <p className="text-base md:text-lg mb-4 leading-relaxed text-muted-foreground">
              All icons available in BioSketch are in the <span className="font-semibold text-secondary">public domain</span> or provided under open licenses that permit free use. This means:
            </p>
            <ul className="space-y-2 ml-8 mb-6">
              {['Icons may be used without restriction in your scientific projects', 'No copyright permission is required for use of these icons', 'Icons may be modified, adapted, and incorporated into derivative works'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg">
                  <span className="text-secondary font-semibold text-xl">•</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="scientific-card p-4 bg-accent/10">
              <p className="text-base md:text-lg">
                <span className="text-accent font-semibold">Attribution Recommendation:</span> <span className="text-muted-foreground">While not legally required, we strongly encourage users to provide attribution to the original authors of icons when possible. Proper attribution supports the scientific community and acknowledges the valuable contributions of icon creators.</span>
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent/10 rounded-xl flex-shrink-0">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">3. User Content</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              You retain all rights to the diagrams, projects, and content you create using BioSketch. You are responsible for ensuring that your use of the application and any content you create complies with applicable laws and regulations.
            </p>
          </div>

          {/* Section 4 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">4. Community Submissions</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              By submitting icons or projects to the BioSketch community library, you grant BioSketch and its users a non-exclusive, worldwide, royalty-free license to use, display, and distribute your submissions. You confirm that you have the right to submit such content.
            </p>
          </div>

          {/* Section 5 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary/10 rounded-xl flex-shrink-0">
                <ShieldAlert className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">5. Disclaimer of Warranties</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              BioSketch is provided "as is" without any warranties, express or implied. We do not guarantee that the application will be error-free, uninterrupted, or meet your specific requirements. Use of BioSketch is at your own risk.
            </p>
          </div>

          {/* Section 6 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent/10 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">6. Limitation of Liability</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              To the maximum extent permitted by law, BioSketch and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the application.
            </p>
          </div>

          {/* Section 7 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">7. Scientific Accuracy</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              While BioSketch provides tools for creating scientific diagrams, users are solely responsible for ensuring the scientific accuracy, validity, and appropriateness of their work. BioSketch does not verify or validate the scientific content of user-created diagrams.
            </p>
          </div>

          {/* Section 8 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary/10 rounded-xl flex-shrink-0">
                <Lock className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">8. Data and Privacy</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              We respect your privacy and handle your data responsibly. Your projects and personal information are stored securely. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
          </div>

          {/* Section 9 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent/10 rounded-xl flex-shrink-0">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">9. Modifications to Terms</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of BioSketch after changes constitutes acceptance of the modified terms. We encourage users to review these terms periodically.
            </p>
          </div>

          {/* Section 10 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <Ban className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">10. Account Termination</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or misuse the application.
            </p>
          </div>

          {/* Section 11 */}
          <div className="scientific-card p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary/10 rounded-xl flex-shrink-0">
                <Gavel className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">11. Governing Law</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              These terms shall be governed by and construed in accordance with applicable international laws regarding software use and intellectual property.
            </p>
          </div>

          {/* Contact Section */}
          <div className="scientific-card p-8 text-center bg-gradient-to-br from-accent/10 to-primary/10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/20 rounded-xl">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-lg md:text-xl font-semibold">Questions?</p>
            </div>
            <p className="text-base md:text-lg mb-4 text-muted-foreground">
              If you have questions about these terms, please contact us through our contact form.
            </p>
            <Button
              onClick={() => navigate("/contact")}
              size="lg"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
