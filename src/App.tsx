import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Canvas from "./pages/Canvas";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Testimonials from "./pages/Testimonials";
import MySubmissions from "./pages/MySubmissions";
import ReleaseNotes from "./pages/ReleaseNotes";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Share from "./pages/Share";
import Analytics from "./pages/Analytics";
import EmailNotifications from "./pages/EmailNotifications";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogManagement from "./pages/admin/BlogManagement";
import BlogEditor from "./pages/admin/BlogEditor";
import BlogCategories from "./pages/admin/BlogCategories";
import BlogTags from "./pages/admin/BlogTags";
import PowerPointGenerator from "./pages/admin/PowerPointGenerator";
import AISettings from "./pages/admin/AISettings";
import RateLimits from "./pages/admin/RateLimits";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<MainLayout><Index /></MainLayout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/projects" element={<MainLayout><ProtectedRoute><Projects /></ProtectedRoute></MainLayout>} />
            <Route path="/profile" element={<MainLayout><ProtectedRoute><Profile /></ProtectedRoute></MainLayout>} />
            <Route path="/community" element={<MainLayout><ProtectedRoute><Community /></ProtectedRoute></MainLayout>} />
            <Route path="/canvas" element={<ProtectedRoute><Canvas /></ProtectedRoute>} />
            <Route path="/my-submissions" element={<MainLayout><ProtectedRoute><MySubmissions /></ProtectedRoute></MainLayout>} />
            <Route path="/testimonials" element={<MainLayout><Testimonials /></MainLayout>} />
            <Route path="/release-notes" element={<MainLayout><ReleaseNotes /></MainLayout>} />
            <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
            <Route path="/share" element={<MainLayout><Share /></MainLayout>} />
            <Route path="/blog" element={<MainLayout><ProtectedRoute><Blog /></ProtectedRoute></MainLayout>} />
            <Route path="/blog/:slug" element={<MainLayout><ProtectedRoute><BlogPost /></ProtectedRoute></MainLayout>} />
            <Route path="/admin" element={<MainLayout><AdminRoute><Admin /></AdminRoute></MainLayout>} />
            <Route path="/admin/analytics" element={<MainLayout><AdminRoute><Analytics /></AdminRoute></MainLayout>} />
            <Route path="/admin/email-notifications" element={<MainLayout><AdminRoute><EmailNotifications /></AdminRoute></MainLayout>} />
            <Route path="/admin/powerpoint-generator" element={<MainLayout><AdminRoute><PowerPointGenerator /></AdminRoute></MainLayout>} />
            <Route path="/admin/ai-settings" element={<MainLayout><AdminRoute><AISettings /></AdminRoute></MainLayout>} />
            <Route path="/admin/rate-limits" element={<MainLayout><AdminRoute><RateLimits /></AdminRoute></MainLayout>} />
            <Route path="/admin/blog" element={<MainLayout><AdminRoute><BlogManagement /></AdminRoute></MainLayout>} />
            <Route path="/admin/blog/new" element={<MainLayout><AdminRoute><BlogEditor /></AdminRoute></MainLayout>} />
            <Route path="/admin/blog/edit/:id" element={<MainLayout><AdminRoute><BlogEditor /></AdminRoute></MainLayout>} />
            <Route path="/admin/blog/categories" element={<MainLayout><AdminRoute><BlogCategories /></AdminRoute></MainLayout>} />
            <Route path="/admin/blog/tags" element={<MainLayout><AdminRoute><BlogTags /></AdminRoute></MainLayout>} />
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
