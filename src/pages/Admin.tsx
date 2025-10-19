import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b glass-effect shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="submitted" className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="submitted">Submitted Projects</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="icon-submissions">Icon Submissions</TabsTrigger>
            <TabsTrigger value="community-uploads">Community Uploads</TabsTrigger>
            <TabsTrigger value="upload">Upload Icons</TabsTrigger>
            <TabsTrigger value="manage">Manage Icons</TabsTrigger>
            <TabsTrigger value="clean-names">Clean Icon Names</TabsTrigger>
            <TabsTrigger value="sanitize">Icon Sanitizer</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="submitted" className="mt-6">
            <SubmittedProjects />
          </TabsContent>
          
          <TabsContent value="testimonials" className="mt-6">
            <TestimonialManager />
          </TabsContent>
          
          <TabsContent value="icon-submissions" className="mt-6">
            <IconSubmissionManager />
          </TabsContent>
          
          <TabsContent value="community-uploads" className="mt-6">
            <CommunityUploader />
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6">
            <div className="space-y-6">
              <IconUploader />
              <IconCleanup />
              <ThumbnailGenerator />
              <ThumbnailRegenerator />
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="mt-6">
            <IconManager />
          </TabsContent>
          
          <TabsContent value="clean-names" className="mt-6">
            <IconNameCleaner />
          </TabsContent>
          
          <TabsContent value="sanitize" className="mt-6">
            <IconSanitizer />
          </TabsContent>
          
          <TabsContent value="categories" className="mt-6">
            <CategoryManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
