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
    <div className="min-h-screen notebook-page ruled-lines">
      <SEOHead
        title="Terms and Conditions - BioSketch"
        description="Terms of service and usage guidelines for BioSketch scientific illustration tool. Learn about licensing, usage rights, and community guidelines."
        canonical="https://biosketch.art/terms"
      />
      
      {/* Margin line decoration */}
      <div className="margin-line" />
      
      {/* Header */}
      <div className="border-b-2 border-[hsl(var(--pencil-gray))] bg-[#f9f6f0] paper-shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="pencil-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title Section - Sticky Note */}
        <div className="mb-12 text-center">
          <div className="sticky-note inline-block max-w-2xl mx-auto rotate-[-0.5deg] shadow-none">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-4 bg-[hsl(var(--ink-blue))]/10 rounded-full border-2 border-[hsl(var(--ink-blue))]/20">
                <Scale className="h-10 w-10 text-[hsl(var(--ink-blue))]" />
              </div>
              <h1 className="text-5xl md:text-6xl font-['Caveat'] text-[hsl(var(--ink-blue))]">Terms & Conditions</h1>
            </div>
            <p className="text-xl font-source-serif text-[hsl(var(--pencil-gray))]">Last Updated: January 2025</p>
          </div>
        </div>

        {/* Intro Card - Paper with Washi Tape */}
        <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-8 mb-8 relative">
          {/* Decorative washi tape */}
          <div className="absolute -top-3 left-8 w-24 h-6 bg-[hsl(var(--highlighter-yellow))]/50 rotate-[-3deg] border border-[hsl(var(--pencil-gray))]/30" />
          <div className="absolute -top-3 right-8 w-24 h-6 bg-[hsl(var(--highlighter-yellow))]/50 rotate-[3deg] border border-[hsl(var(--pencil-gray))]/30" />
          
          <p className="text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
            <span className="font-['Caveat'] text-2xl text-[hsl(var(--ink-blue))]">Welcome to BioSketch!</span> By using our application, you agree to these terms and conditions. 
            We've designed these terms to be fair, transparent, and supportive of the scientific community.
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">1. License and Usage</h2>
            </div>
            <p className="text-base md:text-lg mb-4 leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              BioSketch is provided <span className="highlighter-bg px-1">free of charge</span> for use in all scientific projects, including but not limited to:
            </p>
            <ul className="space-y-2 ml-8">
              {['Academic research publications', 'Educational materials and presentations', 'Scientific documentation and reports', 'Commercial and non-commercial scientific communication'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg">
                  <span className="text-[hsl(var(--ink-blue))] font-bold text-xl">•</span>
                  <span className="font-source-serif text-[hsl(var(--pencil-gray))]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">2. Icon Library</h2>
            </div>
            <p className="text-base md:text-lg mb-4 leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              All icons available in BioSketch are in the <span className="highlighter-bg px-1">public domain</span> or provided under open licenses that permit free use. This means:
            </p>
            <ul className="space-y-2 ml-8 mb-6">
              {['Icons may be used without restriction in your scientific projects', 'No copyright permission is required for use of these icons', 'Icons may be modified, adapted, and incorporated into derivative works'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg">
                  <span className="text-[hsl(var(--ink-blue))] font-bold text-xl">•</span>
                  <span className="font-source-serif text-[hsl(var(--pencil-gray))]">{item}</span>
                </li>
              ))}
            </ul>
            <div className="sticky-note inline-block w-full rotate-[0.5deg] shadow-none">
              <p className="text-base md:text-lg font-source-serif">
                <span className="font-['Caveat'] text-xl text-[hsl(var(--ink-blue))]">Attribution Recommendation:</span> <span className="text-[hsl(var(--pencil-gray))]">While not legally required, we strongly encourage users to provide attribution to the original authors of icons when possible. Proper attribution supports the scientific community and acknowledges the valuable contributions of icon creators.</span>
              </p>
            </div>
          </div>

          {/* Sections 3-11 */}
          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">3. User Content</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              You retain all rights to the diagrams, projects, and content you create using BioSketch. You are responsible for ensuring that your use of the application and any content you create complies with applicable laws and regulations.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <Upload className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">4. Community Submissions</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              By submitting icons or projects to the BioSketch community library, you grant BioSketch and its users a non-exclusive, worldwide, royalty-free license to use, display, and distribute your submissions. You confirm that you have the right to submit such content.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">5. Disclaimer of Warranties</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              BioSketch is provided "as is" without any warranties, express or implied. We do not guarantee that the application will be error-free, uninterrupted, or meet your specific requirements. Use of BioSketch is at your own risk.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">6. Limitation of Liability</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              To the maximum extent permitted by law, BioSketch and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the application.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">7. Scientific Accuracy</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              While BioSketch provides tools for creating scientific diagrams, users are solely responsible for ensuring the scientific accuracy, validity, and appropriateness of their work. BioSketch does not verify or validate the scientific content of user-created diagrams.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">8. Data and Privacy</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              We respect your privacy and handle your data responsibly. Your projects and personal information are stored securely. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">9. Modifications to Terms</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              We reserve the right to modify these terms at any time. Continued use of BioSketch after changes constitutes acceptance of the modified terms. We encourage users to review these terms periodically.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <Ban className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">10. Account Termination</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or misuse the application.
            </p>
          </div>

          <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center flex-shrink-0">
                <Gavel className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-['Caveat'] text-[hsl(var(--ink-blue))]">11. Governing Law</h2>
            </div>
            <p className="text-base md:text-lg leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
              These terms shall be governed by and construed in accordance with applicable international laws regarding software use and intellectual property.
            </p>
          </div>

          {/* Contact Section - Sticky Note */}
          <div className="sticky-note text-center rotate-[-0.5deg] shadow-none">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
              </div>
              <p className="text-lg md:text-xl font-['Caveat'] text-[hsl(var(--ink-blue))]">Questions?</p>
            </div>
            <p className="text-base md:text-lg mb-4 font-source-serif text-[hsl(var(--pencil-gray))]">
              If you have questions about these terms, please contact us through our contact form.
            </p>
            <Button
              onClick={() => navigate("/contact")}
              size="lg"
              className="pencil-button font-['Caveat'] text-lg"
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
