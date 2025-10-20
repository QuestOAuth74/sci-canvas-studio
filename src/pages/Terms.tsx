import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Last Updated: January 2025</h2>
            <p className="text-muted-foreground">
              Welcome to BioSketch. By using our application, you agree to these terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. License and Usage</h2>
            <p className="text-muted-foreground mb-4">
              BioSketch is provided free of charge for use in all scientific projects, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Academic research publications</li>
              <li>Educational materials and presentations</li>
              <li>Scientific documentation and reports</li>
              <li>Non-commercial scientific communication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Icon Library</h2>
            <p className="text-muted-foreground mb-4">
              All icons available in BioSketch are in the public domain or provided under open licenses that permit free use. This means:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Icons may be used without restriction in your scientific projects</li>
              <li>No copyright permission is required for use of these icons</li>
              <li>Icons may be modified, adapted, and incorporated into derivative works</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Attribution Recommendation:</strong> While not legally required, we strongly encourage users to provide attribution to the original authors of icons when possible. Proper attribution supports the scientific community and acknowledges the valuable contributions of icon creators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
            <p className="text-muted-foreground">
              You retain all rights to the diagrams, projects, and content you create using BioSketch. You are responsible for ensuring that your use of the application and any content you create complies with applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Community Submissions</h2>
            <p className="text-muted-foreground">
              By submitting icons or projects to the BioSketch community library, you grant BioSketch and its users a non-exclusive, worldwide, royalty-free license to use, display, and distribute your submissions. You confirm that you have the right to submit such content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              BioSketch is provided "as is" without any warranties, express or implied. We do not guarantee that the application will be error-free, uninterrupted, or meet your specific requirements. Use of BioSketch is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, BioSketch and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Scientific Accuracy</h2>
            <p className="text-muted-foreground">
              While BioSketch provides tools for creating scientific diagrams, users are solely responsible for ensuring the scientific accuracy, validity, and appropriateness of their work. BioSketch does not verify or validate the scientific content of user-created diagrams.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data and Privacy</h2>
            <p className="text-muted-foreground">
              We respect your privacy and handle your data responsibly. Your projects and personal information are stored securely. We do not sell or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Modifications to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of BioSketch after changes constitutes acceptance of the modified terms. We encourage users to review these terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Account Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or misuse the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with applicable international laws regarding software use and intellectual property.
            </p>
          </section>

          <section className="mt-8 pt-8 border-t">
            <p className="text-muted-foreground">
              If you have questions about these terms, please contact us through the application's support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;