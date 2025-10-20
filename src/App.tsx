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
import NotFound from "./pages/NotFound";

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
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
