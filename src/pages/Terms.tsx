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

const Terms = () => {
  const navigate = useNavigate();

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

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary border-[4px] border-foreground rotate-3">
              <Scale className="h-12 w-12 text-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase">Terms & Conditions</h1>
          </div>
          <p className="text-xl font-bold text-muted-foreground">Last Updated: January 2025</p>
        </div>

        {/* Intro Card */}
        <div className="bg-accent/20 border-[4px] border-foreground neo-brutalist-shadow p-8 mb-8">
          <p className="text-lg font-bold leading-relaxed">
            Welcome to BioSketch! By using our application, you agree to these terms and conditions. 
            We've designed these terms to be fair, transparent, and supportive of the scientific community.
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary border-[3px] border-foreground -rotate-3 shrink-0">
                <FlaskConical className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">1. License and Usage</h2>
            </div>
            <p className="text-base md:text-lg font-medium mb-4 leading-relaxed">
              BioSketch is provided <span className="font-bold text-primary">free of charge</span> for use in all scientific projects, including but not limited to:
            </p>
            <ul className="space-y-2 ml-8">
              {['Academic research publications', 'Educational materials and presentations', 'Scientific documentation and reports', 'Non-commercial scientific communication'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg font-medium">
                  <span className="text-primary font-black text-xl">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary border-[3px] border-foreground rotate-3 shrink-0">
                <ImageIcon className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">2. Icon Library</h2>
            </div>
            <p className="text-base md:text-lg font-medium mb-4 leading-relaxed">
              All icons available in BioSketch are in the <span className="font-bold text-secondary">public domain</span> or provided under open licenses that permit free use. This means:
            </p>
            <ul className="space-y-2 ml-8 mb-6">
              {['Icons may be used without restriction in your scientific projects', 'No copyright permission is required for use of these icons', 'Icons may be modified, adapted, and incorporated into derivative works'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg font-medium">
                  <span className="text-secondary font-black text-xl">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-accent/20 border-[3px] border-foreground p-4">
              <p className="text-base md:text-lg font-bold">
                <span className="text-accent">Attribution Recommendation:</span> While not legally required, we strongly encourage users to provide attribution to the original authors of icons when possible. Proper attribution supports the scientific community and acknowledges the valuable contributions of icon creators.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent border-[3px] border-foreground -rotate-3 shrink-0">
                <FileText className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">3. User Content</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              You retain all rights to the diagrams, projects, and content you create using BioSketch. You are responsible for ensuring that your use of the application and any content you create complies with applicable laws and regulations.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary border-[3px] border-foreground rotate-3 shrink-0">
                <Upload className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">4. Community Submissions</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              By submitting icons or projects to the BioSketch community library, you grant BioSketch and its users a non-exclusive, worldwide, royalty-free license to use, display, and distribute your submissions. You confirm that you have the right to submit such content.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary border-[3px] border-foreground -rotate-3 shrink-0">
                <ShieldAlert className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">5. Disclaimer of Warranties</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              BioSketch is provided "as is" without any warranties, express or implied. We do not guarantee that the application will be error-free, uninterrupted, or meet your specific requirements. Use of BioSketch is at your own risk.
            </p>
          </div>

          {/* Section 6 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent border-[3px] border-foreground rotate-3 shrink-0">
                <AlertTriangle className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">6. Limitation of Liability</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              To the maximum extent permitted by law, BioSketch and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the application.
            </p>
          </div>

          {/* Section 7 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary border-[3px] border-foreground -rotate-3 shrink-0">
                <FlaskConical className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">7. Scientific Accuracy</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              While BioSketch provides tools for creating scientific diagrams, users are solely responsible for ensuring the scientific accuracy, validity, and appropriateness of their work. BioSketch does not verify or validate the scientific content of user-created diagrams.
            </p>
          </div>

          {/* Section 8 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary border-[3px] border-foreground rotate-3 shrink-0">
                <Lock className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">8. Data and Privacy</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              We respect your privacy and handle your data responsibly. Your projects and personal information are stored securely. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
          </div>

          {/* Section 9 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent border-[3px] border-foreground -rotate-3 shrink-0">
                <FileText className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">9. Modifications to Terms</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of BioSketch after changes constitutes acceptance of the modified terms. We encourage users to review these terms periodically.
            </p>
          </div>

          {/* Section 10 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary border-[3px] border-foreground rotate-3 shrink-0">
                <Ban className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">10. Account Termination</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or misuse the application.
            </p>
          </div>

          {/* Section 11 */}
          <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary border-[3px] border-foreground -rotate-3 shrink-0">
                <Gavel className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase">11. Governing Law</h2>
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              These terms shall be governed by and construed in accordance with applicable international laws regarding software use and intellectual property.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-accent/20 border-[4px] border-foreground neo-brutalist-shadow p-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent border-[3px] border-foreground rotate-3">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-lg md:text-xl font-black uppercase">Questions?</p>
            </div>
            <p className="text-base md:text-lg font-bold">
              If you have questions about these terms, please contact us through the application's support channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;