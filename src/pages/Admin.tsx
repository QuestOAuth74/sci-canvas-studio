import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IconUploader } from "@/components/admin/IconUploader";
import { IconManager } from "@/components/admin/IconManager";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Icons</TabsTrigger>
            <TabsTrigger value="manage">Manage Icons</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <IconUploader />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-6">
            <IconManager />
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
