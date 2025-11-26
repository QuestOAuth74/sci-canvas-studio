import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Mail, FileText, Sparkles, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CommunityMetricsInflator } from "@/components/admin/CommunityMetricsInflator";
import { IconUploader } from "@/components/admin/IconUploader";
import { IconManager } from "@/components/admin/IconManager";
import { IconCleanup } from "@/components/admin/IconCleanup";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ThumbnailGenerator } from "@/components/admin/ThumbnailGenerator";
import { ThumbnailRegenerator } from "@/components/admin/ThumbnailRegenerator";
import { SubmittedProjects } from "@/components/admin/SubmittedProjects";
import { TestimonialManager } from "@/components/admin/TestimonialManager";
import { IconSubmissionManager } from "@/components/admin/IconSubmissionManager";
import { IconSanitizer } from "@/components/admin/IconSanitizer";
import { IconNameCleaner } from "@/components/admin/IconNameCleaner";
import { CommunityUploader } from "@/components/admin/CommunityUploader";
import { ContactMessagesManager } from "@/components/admin/ContactMessagesManager";
import { ToolFeedbackManager } from "@/components/admin/ToolFeedbackManager";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { Separator } from "@/components/ui/separator";
import { SEOHead } from "@/components/SEO/SEOHead";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex bg-background">
        <SEOHead
          title="Admin Dashboard - BioSketch"
          description="BioSketch Admin Dashboard"
          noindex={true}
        />
        
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b glass-effect shadow-sm">
            <div className="px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    BioSketch
                  </h1>
                  <span className="text-sm text-muted-foreground">Admin</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/ai-settings")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/powerpoint-generator")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PowerPoint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/rate-limits")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Rate Limits
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/analytics")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/email-notifications")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <AdminNotificationBell />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-12">
              {/* Community Metrics */}
              <section id="community-metrics">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold tracking-tight">Community Metrics</h2>
                  <p className="text-muted-foreground">Inflate engagement metrics to create FOMO effect</p>
                </div>
                <CommunityMetricsInflator />
              </section>

              <Separator className="my-12" />

              {/* Announcements */}
              <section id="announcements">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold tracking-tight">Send Announcements</h2>
                  <p className="text-muted-foreground">Send in-app notifications to users</p>
                </div>
                <AnnouncementManager />
              </section>

              <Separator className="my-12" />

              {/* Section 1: Submitted Projects */}
              <section id="submitted-projects">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Submitted Projects</h2>
              <p className="text-muted-foreground">Review and manage community submitted projects</p>
            </div>
            <SubmittedProjects />
          </section>

          <Separator className="my-12" />

          {/* Section 2: Testimonials */}
          <section id="testimonials">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Testimonials</h2>
              <p className="text-muted-foreground">Approve, reject, or delete user testimonials</p>
            </div>
            <TestimonialManager />
          </section>

          <Separator className="my-12" />

          {/* Section 3: Icon Submissions */}
          <section id="icon-submissions">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Icon Submissions</h2>
              <p className="text-muted-foreground">Review and manage community submitted icons</p>
            </div>
            <IconSubmissionManager />
          </section>

          <Separator className="my-12" />

          {/* Section 4: Community Uploads */}
          <section id="community-uploads">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Community Uploads</h2>
              <p className="text-muted-foreground">Upload assets to the community library</p>
            </div>
            <CommunityUploader />
          </section>

          <Separator className="my-12" />

          {/* Section 5: Upload Icons */}
          <section id="upload-icons">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Upload Icons</h2>
              <p className="text-muted-foreground">Upload, cleanup, and generate thumbnails for icons</p>
            </div>
            <div className="space-y-6">
              <IconUploader />
              <IconCleanup />
              <ThumbnailGenerator />
              <ThumbnailRegenerator />
            </div>
          </section>

          <Separator className="my-12" />

          {/* Section 6: Manage Icons */}
          <section id="manage-icons">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Manage Icons</h2>
              <p className="text-muted-foreground">View, edit, and delete existing icons</p>
            </div>
            <IconManager />
          </section>

          <Separator className="my-12" />

          {/* Section 7: Clean Icon Names */}
          <section id="clean-names">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Clean Icon Names</h2>
              <p className="text-muted-foreground">Scan and fix corrupted icon names</p>
            </div>
            <IconNameCleaner />
          </section>

          <Separator className="my-12" />

          {/* Section 8: Icon Sanitizer */}
          <section id="sanitize">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Icon Sanitizer</h2>
              <p className="text-muted-foreground">Sanitize and validate icon SVG content</p>
            </div>
            <IconSanitizer />
          </section>

          <Separator className="my-12" />

          {/* Section 9: Categories */}
          <section id="categories">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
              <p className="text-muted-foreground">Add, view, and manage icon categories</p>
            </div>
            <CategoryManager />
          </section>

          <Separator className="my-12" />

          {/* Section 10: Contact Messages */}
          <section id="contact-messages">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Contact Messages</h2>
              <p className="text-muted-foreground">View and respond to user contact form submissions</p>
            </div>
            <ContactMessagesManager />
          </section>

          <Separator className="my-12" />

          {/* Section 11: Tool Feedback */}
          <section id="tool-feedback">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight">Tool Feedback</h2>
              <p className="text-muted-foreground">User ratings and feedback for the design tool</p>
            </div>
            <ToolFeedbackManager />
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
