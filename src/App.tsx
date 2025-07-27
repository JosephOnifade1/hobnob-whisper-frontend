import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestChatProvider } from "@/contexts/GuestChatContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import AccountSettings from "./pages/AccountSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AIAgent from "./pages/AIAgent";
import NotFound from "./pages/NotFound";
import ToolsDashboard from "./pages/ToolsDashboard";
import AvatarGenerator from "./pages/AvatarGenerator";
import DocumentConverter from "./pages/DocumentConverter";
import ImageGeneration from "./pages/ImageGeneration";

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
        <GuestChatProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/ai-agent" element={<AIAgent />} />
                <Route path="/account" element={<AccountSettings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/tools" element={<ToolsDashboard />} />
                <Route path="/tools/avatar-generator" element={<AvatarGenerator />} />
                <Route path="/tools/document-converter" element={<DocumentConverter />} />
                <Route path="/tools/image-generation" element={<ImageGeneration />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </GuestChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
