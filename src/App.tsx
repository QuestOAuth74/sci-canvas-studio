import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/admin/email-notifications" element={<AdminRoute><EmailNotifications /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
