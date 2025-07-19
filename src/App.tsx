
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import VideoGeneration from "./pages/VideoGeneration";
import FakeNewsDetection from "./pages/FakeNewsDetection";
import AccountSettings from "./pages/AccountSettings";
import ExploreTools from "./pages/ExploreTools";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ToolsDashboard from "./pages/ToolsDashboard";
import AvatarGenerator from "./pages/AvatarGenerator";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Apply saved theme on app load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/video-generation" element={<VideoGeneration />} />
              <Route path="/fake-news-detection" element={<FakeNewsDetection />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/explore" element={<ExploreTools />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/tools" element={<ToolsDashboard />} />
              <Route path="/tools/avatar-generator" element={<AvatarGenerator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
