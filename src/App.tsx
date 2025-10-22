import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Loader2 } from "lucide-react";

// Only eagerly load the landing page
import Index from "./pages/Index";

// Lazy load all other pages
const Canvas = lazy(() => import("./pages/Canvas"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const Projects = lazy(() => import("./pages/Projects"));
const Profile = lazy(() => import("./pages/Profile"));
const Community = lazy(() => import("./pages/Community"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const MySubmissions = lazy(() => import("./pages/MySubmissions"));
const ReleaseNotes = lazy(() => import("./pages/ReleaseNotes"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Share = lazy(() => import("./pages/Share"));
const Analytics = lazy(() => import("./pages/Analytics"));
const EmailNotifications = lazy(() => import("./pages/EmailNotifications"));
const AdminUserProjects = lazy(() => import("./pages/AdminUserProjects"));

const queryClient = new QueryClient();

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/canvas" element={<ProtectedRoute><Canvas /></ProtectedRoute>} />
              <Route path="/my-submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/release-notes" element={<ReleaseNotes />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/share" element={<Share />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
              <Route path="/admin/user-projects" element={<AdminRoute><AdminUserProjects /></AdminRoute>} />
              <Route path="/admin/email-notifications" element={<AdminRoute><EmailNotifications /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
